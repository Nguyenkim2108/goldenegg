// Simple types for Vercel deployment - no drizzle dependencies

export interface User {
  id: number;
  username: string;
  password: string;
  score: number;
  isAdmin: boolean;
  createdAt: Date;
}

export interface CustomLink {
  id: number;
  userId: number;
  domain: string;
  subdomain: string;
  path: string;
  active: boolean;
  eggId: number;
  reward: number | string;
  used: boolean;
  protocol: string;
  createdAt: Date;
  manuallyBroken?: boolean;
}

// Game state type
export interface GameState {
  deadline: number;
  brokenEggs: number[];
  progress: number;
  eggs?: EggData[];
  allowedEggId?: number;
  linkId?: number;
  linkUsed?: boolean;
}

export interface EggData {
  id: number;
  broken: boolean;
  reward: number | string;
  winningRate: number;
  allowed?: boolean;
  manuallyBroken?: boolean;
}

// API Request/Response types
export interface UpdateEggRequest {
  eggId: number;
  reward: number | string;
  winningRate: number;
}

export interface CreateLinkRequest {
  domain: string;
  subdomain: string;
  path?: string;
  eggId: number;
  protocol?: string;
}

export interface LinkResponse {
  id: number;
  fullUrl: string;
  subdomain: string;
  domain: string;
  path: string | "";
  active: boolean;
  eggId: number;
  reward: number | string;
  used: boolean;
  protocol: string;
  createdAt: string;
}

export interface GameLinkInfo {
  linkId: number;
  eggId: number;
  reward: number;
  used: boolean;
}

export interface BreakEggByLinkRequest {
  linkId: number;
  eggId: number;
}

export interface SetEggBrokenStateRequest {
  eggId: number;
  broken: boolean;
}

export interface RevealAllEggsResult {
  eggs: EggData[];
  brokenEggId: number;
  reward: number | string;
  success: boolean;
}

export interface BreakEggResult {
  eggId: number;
  reward: number | string;
  success: boolean;
}

export interface ClaimRewardsResult {
  totalReward: number;
  success: boolean;
}
