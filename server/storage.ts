import { 
  GameState, 
  LeaderboardEntry, 
  User, 
  CustomLink, 
  UpdateEggRequest, 
  CreateLinkRequest, 
  LinkResponse,
  EggData as SchemaEggData 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, customLinks } from "@shared/schema";

// Constants for game logic
const TOTAL_EGGS = 9;
const MIN_REWARD = 50;
const MAX_REWARD = 500;
const DEFAULT_DOMAIN = "dammedaga.fun";

// Interface for egg data
interface EggData {
  id: number;
  reward: number;
  broken: boolean;
}

// Interface for break egg result
interface BreakEggResult {
  eggId: number;
  reward: number;
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
  updateEggReward(eggId: number, reward: number): Promise<EggData>;
  getAllEggs(): Promise<EggData[]>;
  createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse>;
  getCustomLinks(): Promise<LinkResponse[]>;
  deleteCustomLink(id: number): Promise<boolean>;
}

// Extend storage interface with game methods
export interface IStorage extends AdminOperations {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; isAdmin?: boolean }): Promise<User>;
  
  // Game specific methods
  getGameState(): Promise<GameState>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  breakEgg(eggId: number): Promise<BreakEggResult>;
  claimRewards(): Promise<ClaimRewardsResult>;
  resetGame(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private eggs: Map<number, EggData>;
  private brokenEggs: number[];
  private totalReward: number;
  private deadline: number;
  private leaderboard: LeaderboardEntry[];
  private customLinks: Map<number, CustomLink>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.eggs = new Map();
    this.brokenEggs = [];
    this.totalReward = 0;
    this.deadline = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    this.currentId = 1;
    this.leaderboard = [];
    this.customLinks = new Map();
    
    // Initialize eggs
    this.initializeEggs();
    
    // Initialize demo leaderboard
    this.initializeLeaderboard();

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
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
      });
    }
  }
  
  // Initialize demo leaderboard
  private initializeLeaderboard(): void {
    // Add some demo users to the leaderboard
    this.leaderboard = [
      { id: 1, username: "1st********", score: 188000 },
      { id: 2, username: "2nd********", score: 88000 },
      { id: 3, username: "3rd********", score: 88000 },
    ];
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
  async getGameState(): Promise<GameState> {
    const allEggs = Array.from(this.eggs.values()).map(egg => ({
      id: egg.id,
      broken: egg.broken,
      reward: egg.reward
    }));

    return {
      deadline: this.deadline,
      brokenEggs: this.brokenEggs,
      progress: this.calculateProgress(),
      eggs: allEggs
    };
  }
  
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.leaderboard;
  }
  
  async breakEgg(eggId: number): Promise<BreakEggResult> {
    // Check if egg exists
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }
    
    // Check if egg is already broken
    if (egg.broken || this.brokenEggs.includes(eggId)) {
      throw new Error(`Egg with ID ${eggId} is already broken`);
    }
    
    // Mark egg as broken
    egg.broken = true;
    this.brokenEggs.push(eggId);
    
    // Add reward to total
    this.totalReward += egg.reward;
    
    // Update egg in map
    this.eggs.set(eggId, egg);
    
    // Return result
    return {
      eggId,
      reward: egg.reward,
      success: true,
    };
  }
  
  async claimRewards(): Promise<ClaimRewardsResult> {
    // Check if there are rewards to claim
    if (this.totalReward <= 0) {
      throw new Error("No rewards to claim");
    }
    
    // Get total reward
    const totalReward = this.totalReward;
    
    // Update leaderboard (for demo, just add a new entry)
    const newEntry: LeaderboardEntry = {
      id: this.currentId++,
      username: `${this.leaderboard.length + 1}th********`,
      score: totalReward,
    };
    
    // Add to leaderboard and sort
    this.leaderboard.push(newEntry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    
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
    // Reset eggs
    this.initializeEggs();
    
    // Reset broken eggs and total reward
    this.brokenEggs = [];
    this.totalReward = 0;
    
    // Reset deadline (24 hours from now)
    this.deadline = Date.now() + 24 * 60 * 60 * 1000;
  }

  // Admin methods
  async updateEggReward(eggId: number, reward: number): Promise<EggData> {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }

    // Update reward
    egg.reward = reward;
    this.eggs.set(eggId, egg);

    return egg;
  }

  async getAllEggs(): Promise<EggData[]> {
    return Array.from(this.eggs.values());
  }

  async createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse> {
    const id = this.currentId++;
    const customLink: CustomLink = {
      id,
      userId: 1, // Default to admin user
      domain: linkData.domain || DEFAULT_DOMAIN,
      subdomain: linkData.subdomain,
      path: linkData.path || "",
      active: true,
      createdAt: new Date()
    };

    this.customLinks.set(id, customLink);

    return {
      id,
      fullUrl: `https://${customLink.subdomain}.${customLink.domain}${customLink.path || ''}`,
      subdomain: customLink.subdomain,
      domain: customLink.domain,
      path: customLink.path || '',
      active: customLink.active,
      createdAt: customLink.createdAt.toISOString()
    };
  }

  async getCustomLinks(): Promise<LinkResponse[]> {
    return Array.from(this.customLinks.values()).map(link => ({
      id: link.id,
      fullUrl: `https://${link.subdomain}.${link.domain}${link.path}`,
      subdomain: link.subdomain,
      domain: link.domain,
      path: link.path,
      active: link.active,
      createdAt: link.createdAt.toISOString()
    }));
  }

  async deleteCustomLink(id: number): Promise<boolean> {
    return this.customLinks.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: { username: string; password: string; isAdmin?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        password: insertUser.password,
        isAdmin: insertUser.isAdmin || false
      })
      .returning();
    return user;
  }

  async getGameState(): Promise<GameState> {
    // Implement with database storage later
    return storage.getGameState();
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Implement with database storage later
    return storage.getLeaderboard();
  }

  async breakEgg(eggId: number): Promise<BreakEggResult> {
    // Implement with database storage later
    return storage.breakEgg(eggId);
  }

  async claimRewards(): Promise<ClaimRewardsResult> {
    // Implement with database storage later
    return storage.claimRewards();
  }

  async resetGame(): Promise<void> {
    // Implement with database storage later
    return storage.resetGame();
  }

  async updateEggReward(eggId: number, reward: number): Promise<EggData> {
    // Implement with database storage later
    return storage.updateEggReward(eggId, reward);
  }

  async getAllEggs(): Promise<EggData[]> {
    // Implement with database storage later
    return storage.getAllEggs();
  }

  async createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse> {
    const [link] = await db
      .insert(customLinks)
      .values({
        userId: 1, // Default to admin user for now
        domain: linkData.domain || DEFAULT_DOMAIN,
        subdomain: linkData.subdomain,
        path: linkData.path || ""
      })
      .returning();

    return {
      id: link.id,
      fullUrl: `https://${link.subdomain}.${link.domain}${link.path}`,
      subdomain: link.subdomain,
      domain: link.domain,
      path: link.path,
      active: link.active,
      createdAt: link.createdAt.toISOString()
    };
  }

  async getCustomLinks(): Promise<LinkResponse[]> {
    const links = await db.select().from(customLinks);
    
    return links.map(link => ({
      id: link.id,
      fullUrl: `https://${link.subdomain}.${link.domain}${link.path}`,
      subdomain: link.subdomain,
      domain: link.domain,
      path: link.path,
      active: link.active,
      createdAt: link.createdAt.toISOString()
    }));
  }

  async deleteCustomLink(id: number): Promise<boolean> {
    const result = await db
      .delete(customLinks)
      .where(eq(customLinks.id, id))
      .returning({ id: customLinks.id });
    
    return result.length > 0;
  }
}

// Use memory storage for now, can switch to database storage later
export const storage = new MemStorage();
