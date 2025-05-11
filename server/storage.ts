import { GameState, LeaderboardEntry, User } from "@shared/schema";

// Constants for game logic
const TOTAL_EGGS = 9;
const MIN_REWARD = 50;
const MAX_REWARD = 500;

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

// Extend storage interface with game methods
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string }): Promise<User>;
  
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
  currentId: number;

  constructor() {
    this.users = new Map();
    this.eggs = new Map();
    this.brokenEggs = [];
    this.totalReward = 0;
    this.deadline = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    this.currentId = 1;
    this.leaderboard = [];
    
    // Initialize eggs
    this.initializeEggs();
    
    // Initialize demo leaderboard
    this.initializeLeaderboard();
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

  async createUser(insertUser: { username: string; password: string }): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      score: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Game methods
  async getGameState(): Promise<GameState> {
    return {
      deadline: this.deadline,
      brokenEggs: this.brokenEggs,
      progress: this.calculateProgress(),
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
}

export const storage = new MemStorage();
