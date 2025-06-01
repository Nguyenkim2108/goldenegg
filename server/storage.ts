import { 
  GameState, 
  User, 
  CustomLink, 
  UpdateEggRequest, 
  CreateLinkRequest, 
  LinkResponse,
  GameLinkInfo,
  RevealAllEggsResult,
  EggData as SchemaEggData 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, customLinks } from "@shared/schema";

// Constants for game logic
const TOTAL_EGGS = 8; // Đồng bộ với frontend - chỉ hiển thị 8 quả trứng
const MIN_REWARD = 50;
const MAX_REWARD = 500;
const DEFAULT_DOMAIN = "dammedaga.fun";
const DEFAULT_WINNING_RATE = 100; // Tỉ lệ mặc định 100%

// Interface for egg data
interface EggData {
  id: number;
  reward: number | string; // Cho phép cả số và text
  broken: boolean;
  winningRate: number; // Tỉ lệ trúng thưởng cho mỗi quả trứng
  allowed?: boolean;
  manuallyBroken?: boolean; // Trạng thái đã vỡ được đặt thủ công bởi admin
}

// Interface for break egg result
interface BreakEggResult {
  eggId: number;
  reward: number | string; // Cho phép cả số và text
  success: boolean;
}

// Interface for claim rewards result
interface ClaimRewardsResult {
  totalReward: number;
  success: boolean;
}

// Interface for admin operations
interface AdminOperations {
  // Admin methods
  updateEggReward(eggId: number, reward: number, winningRate: number): Promise<EggData>;
  getAllEggs(): Promise<EggData[]>;
  createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse>;
  getCustomLinks(): Promise<LinkResponse[]>;
  deleteCustomLink(id: number): Promise<boolean>;
  setEggBrokenState(eggId: number, broken: boolean): Promise<EggData>; // Thêm phương thức mới
}

// Extend storage interface with game methods
export interface IStorage extends AdminOperations {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; isAdmin?: boolean }): Promise<User>;
  
  // Game specific methods
  getGameState(linkId?: number): Promise<GameState>;
  breakEgg(eggId: number, linkId?: number): Promise<BreakEggResult>;
  revealAllEggs(linkId: number, brokenEggId: number, actualReward: number): Promise<RevealAllEggsResult>;
  claimRewards(): Promise<ClaimRewardsResult>;
  resetGame(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private eggs: Map<number, EggData>;
  private brokenEggs: number[];
  private totalReward: number;
  private deadline: number;
  private customLinks: Map<number, CustomLink>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.eggs = new Map();
    this.brokenEggs = [];
    this.totalReward = 0;
    this.deadline = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    this.currentId = 1;
    this.customLinks = new Map();
    
    // Initialize eggs
    this.initializeEggs();

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Tạo một Custom Link mẫu
    this.createCustomLink({
      domain: DEFAULT_DOMAIN,
      subdomain: "demo",
      path: "",
      eggId: 0,
      protocol: "https"
    });
  }

  // Initialize eggs with random rewards
  private initializeEggs(): void {
    for (let i = 1; i <= TOTAL_EGGS; i++) {
      const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1) + MIN_REWARD);
      this.eggs.set(i, {
        id: i,
        reward,
        broken: false,
        winningRate: DEFAULT_WINNING_RATE // Mỗi quả trứng có tỉ lệ mặc định là 100%
      });
    }
  }
  
  // Calculate progress percentage
  private calculateProgress(): number {
    return (this.brokenEggs.length / TOTAL_EGGS) * 100;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: { username: string; password: string; isAdmin?: boolean }): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      score: 0,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Game methods
  async getGameState(linkId?: number): Promise<GameState> {
    let allowedEggId: number | undefined;
    let linkUsed = false;

    // Nếu có linkId, tìm thông tin link để xác định egg được phép đập
    if (linkId) {
      const link = this.customLinks.get(linkId);
      if (link) {
        allowedEggId = link.eggId;
        linkUsed = link.used;
      }
    }

    // Copy trạng thái eggs và đánh dấu quả được phép đập
    const allEggs = Array.from(this.eggs.values()).map(egg => {
      // Nếu link đã được sử dụng, tính toán reward dựa trên winning rate
      // để hiển thị chính xác trạng thái trứng
      if (linkUsed) {
        const calculatedReward = egg.winningRate > 0 ? egg.reward : 0;
        return {
          id: egg.id,
          broken: egg.broken,
          reward: calculatedReward, // Hiển thị 0 cho trứng 0% win rate
          winningRate: egg.winningRate,
          allowed: allowedEggId ? egg.id === allowedEggId : undefined
        };
      }

      // Link chưa sử dụng, hiển thị reward gốc
      return {
        id: egg.id,
        broken: egg.broken,
        reward: egg.reward,
        winningRate: egg.winningRate,
        allowed: allowedEggId ? egg.id === allowedEggId : undefined
      };
    });

    return {
      deadline: this.deadline,
      brokenEggs: this.brokenEggs,
      progress: this.calculateProgress(),
      eggs: allEggs,
      allowedEggId,
      linkId,
      linkUsed
    };
  }
  
  async breakEgg(eggId: number, linkId?: number): Promise<BreakEggResult> {
    // Nếu có linkId, kiểm tra xem link có tồn tại và đã sử dụng chưa
    if (linkId) {
      const link = this.customLinks.get(linkId);
      
      if (!link) {
        throw new Error(`Link với ID ${linkId} không tồn tại`);
  }
  
      if (link.used) {
        throw new Error(`Link với ID ${linkId} đã được sử dụng`);
      }
      
      // Đánh dấu link đã sử dụng, không cần kiểm tra eggId nữa
      link.used = true;
      this.customLinks.set(linkId, link);
    }
    
    // Check if egg exists
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }
    
    // Check if egg is already broken
    if (egg.broken || this.brokenEggs.includes(eggId)) {
      throw new Error(`Egg with ID ${eggId} is already broken`);
    }
    
    // Xác định xem người chơi có trúng thưởng hay không dựa trên tỉ lệ của quả trứng này
    const randomValue = Math.random() * 100;
    const isWinner = randomValue < egg.winningRate;

    // Log để debug tỷ lệ trúng thưởng
    console.log(`🎲 Egg #${eggId} - Random: ${randomValue.toFixed(2)}, WinningRate: ${egg.winningRate}%, IsWinner: ${isWinner}`);

    // Nếu người chơi không trúng, reward = 0
    const reward = isWinner ? egg.reward : 0;

    console.log(`💰 Egg #${eggId} - Expected Reward: ${egg.reward}, Actual Reward: ${reward}`);
    
    // Mark egg as broken
    egg.broken = true;
    this.brokenEggs.push(eggId);
    
    // Add reward to total (nếu trúng thưởng và là số)
    if (typeof reward === 'number') {
      this.totalReward += reward;
    }
    
    // Update egg in map
    this.eggs.set(eggId, egg);
    
    // Return result
    return {
      eggId,
      reward: reward, // Trả về phần thưởng thực tế (có thể là 0 nếu không trúng)
      success: true,
    };
  }
  
  // Hàm mới để tiết lộ tất cả các quả trứng sau khi đập 1 quả
  async revealAllEggs(linkId: number, brokenEggId: number, actualReward: number): Promise<RevealAllEggsResult> {
    const link = this.customLinks.get(linkId);
    if (!link) {
      throw new Error(`Link với ID ${linkId} không tồn tại`);
    }

    // Lấy quả trứng được đập
    const egg = this.eggs.get(brokenEggId);
    if (!egg) {
      throw new Error(`Egg with ID ${brokenEggId} does not exist`);
    }

    // Sử dụng actualReward đã được tính toán từ breakEgg() thay vì tính lại
    // Điều này đảm bảo tỷ lệ trúng thưởng chỉ được tính một lần duy nhất

    // Tiết lộ phần thưởng của tất cả các quả trứng
    // Tính toán phần thưởng thực tế dựa trên tỷ lệ trúng thưởng
    const allEggs = Array.from(this.eggs.values()).map(egg => {
      // Nếu là quả đã chọn, sử dụng actualReward đã tính toán
      if (egg.id === brokenEggId) {
        return {
          ...egg,
          reward: actualReward, // Sử dụng reward thực tế đã tính toán
          broken: true,
          allowed: true
        };
      }

      // Các quả khác: tính toán phần thưởng dựa trên tỷ lệ trúng thưởng
      // Để hiển thị chính xác những gì người chơi sẽ nhận được
      const calculatedReward = egg.winningRate > 0 ? egg.reward : 0;

      return {
        ...egg,
        reward: calculatedReward, // Hiển thị 0 nếu tỷ lệ trúng thưởng = 0%
        allowed: false
      };
    });

    return {
      eggs: allEggs,
      brokenEggId,
      reward: actualReward, // Sử dụng reward đã được tính toán chính xác từ breakEgg()
      success: true
    };
  }
  
  async claimRewards(): Promise<ClaimRewardsResult> {
    // Check if there are rewards to claim
    if (this.totalReward <= 0) {
      throw new Error("No rewards to claim");
    }
    
    // Get total reward
    const totalReward = this.totalReward;
    
    // Reset game state
    this.resetGameState();
    
    // Return result
    return {
      totalReward,
      success: true,
    };
  }
  
  async resetGame(): Promise<void> {
    this.resetGameState();
  }
  
  private resetGameState(): void {
    // Reset eggs - chỉ reset trạng thái broken, giữ nguyên winningRate và reward đã cài đặt
    this.eggs.forEach((egg, id) => {
      egg.broken = false;
      egg.manuallyBroken = false;
      this.eggs.set(id, egg);
    });

    // Reset broken eggs and total reward
    this.brokenEggs = [];
    this.totalReward = 0;

    // Reset deadline (24 hours from now)
    this.deadline = Date.now() + 24 * 60 * 60 * 1000;
  }

  // Admin methods
  async updateEggReward(eggId: number, reward: number | string, winningRate: number): Promise<EggData> {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }

    // Validate winning rate
    if (winningRate < 0 || winningRate > 100) {
      throw new Error("Tỉ lệ trúng thưởng phải từ 0 đến 100");
    }

    console.log(`⚙️ Admin Update - Egg #${eggId}: Reward ${egg.reward} → ${reward}, WinningRate ${egg.winningRate}% → ${winningRate}%`);

    // Update reward và tỉ lệ trúng thưởng
    egg.reward = reward;
    egg.winningRate = winningRate;

    this.eggs.set(eggId, egg);

    console.log(`✅ Admin Update Complete - Egg #${eggId}: Reward=${reward}, WinningRate=${winningRate}%`);

    return egg;
  }

  // Thêm phương thức mới để thiết lập trạng thái vỡ của quả trứng
  async setEggBrokenState(eggId: number, broken: boolean): Promise<EggData> {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }

    // Cập nhật trạng thái broken
    egg.broken = broken;
    egg.manuallyBroken = broken; // Đánh dấu đã được thay đổi thủ công
    
    // Cập nhật danh sách brokenEggs
    if (broken) {
      if (!this.brokenEggs.includes(eggId)) {
        this.brokenEggs.push(eggId);
      }
    } else {
      this.brokenEggs = this.brokenEggs.filter(id => id !== eggId);
    }
    
    this.eggs.set(eggId, egg);
    return egg;
  }

  async getAllEggs(): Promise<EggData[]> {
    return Array.from(this.eggs.values());
  }

  async createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse> {
    const id = this.currentId++;
    
    // Tạo phần thưởng ngẫu nhiên giữa MIN_REWARD và MAX_REWARD
    const randomReward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1) + MIN_REWARD);
    
    // Kiểm tra dữ liệu đầu vào
    if (!linkData.domain) {
      throw new Error('Domain không được để trống');
    }
    
    // Nếu subdomain là undefined, chuyển thành chuỗi rỗng để tránh lỗi
    const sanitizedSubdomain = linkData.subdomain || '';
    
    const customLink: CustomLink = {
      id,
      userId: 1, // Default to admin user
      domain: linkData.domain,
      subdomain: sanitizedSubdomain,
      path: linkData.path || "",
      active: true,
      eggId: linkData.eggId !== undefined ? linkData.eggId : 0, // Đảm bảo luôn có giá trị mặc định
      reward: randomReward, // Sử dụng phần thưởng ngẫu nhiên 
      used: false, // Mới tạo nên chưa sử dụng
      protocol: linkData.protocol || "https", // Sử dụng protocol từ request hoặc mặc định là https
      createdAt: new Date()
    };

    this.customLinks.set(id, customLink);
    
    // Tạo fullUrl, kiểm tra xem có subdomain không và sử dụng protocol đã chọn
    let fullUrl;
    if (customLink.subdomain) {
      fullUrl = `${customLink.protocol}://${customLink.subdomain}.${customLink.domain}${customLink.path || ''}`;
    } else {
      fullUrl = `${customLink.protocol}://${customLink.domain}${customLink.path || ''}`;
    }

    console.log("Link created:", customLink); // Thêm log để debug

    return {
      id,
      fullUrl,
      subdomain: customLink.subdomain,
      domain: customLink.domain,
      path: customLink.path || '',
      active: customLink.active,
      eggId: customLink.eggId,
      reward: customLink.reward,
      used: customLink.used,
      protocol: customLink.protocol,
      createdAt: customLink.createdAt.toISOString()
    };
  }

  async getCustomLinks(): Promise<LinkResponse[]> {
    return Array.from(this.customLinks.values()).map(link => {
      // Tạo fullUrl, kiểm tra xem có subdomain không và sử dụng protocol được lưu trữ
      let fullUrl;
      if (link.subdomain) {
        fullUrl = `${link.protocol}://${link.subdomain}.${link.domain}${link.path || ''}`;
      } else {
        fullUrl = `${link.protocol}://${link.domain}${link.path || ''}`;
      }
      
      return {
      id: link.id,
        fullUrl,
      subdomain: link.subdomain,
      domain: link.domain,
        path: link.path || '',
      active: link.active,
        eggId: link.eggId,
        reward: link.reward,
        used: link.used,
        protocol: link.protocol || "https",
      createdAt: link.createdAt.toISOString()
      };
    });
  }

  async deleteCustomLink(id: number): Promise<boolean> {
    return this.customLinks.delete(id);
  }
}

// Tạo và xuất instance của MemStorage thay vì DatabaseStorage
export const storage = new MemStorage();
