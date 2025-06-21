import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  score: integer("score").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Game session model
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deadline: timestamp("deadline").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  userId: true,
  deadline: true,
});

// Egg break record model
export const eggBreaks = pgTable("egg_breaks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => gameSessions.id).notNull(),
  eggId: integer("egg_id").notNull(),
  reward: integer("reward").notNull(),
  brokenAt: timestamp("broken_at").defaultNow().notNull(),
});

export const insertEggBreakSchema = createInsertSchema(eggBreaks).pick({
  sessionId: true,
  eggId: true,
  reward: true,
});

// Custom links model
export const customLinks = pgTable("custom_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  domain: text("domain").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  path: text("path").default(""),
  active: boolean("active").default(true).notNull(),
  eggId: integer("egg_id").default(0).notNull(),
  reward: integer("reward").default(0).notNull(),
  used: boolean("used").default(false).notNull(),
  protocol: text("protocol").default("https").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomLinkSchema = createInsertSchema(customLinks).pick({
  userId: true,
  domain: true,
  subdomain: true,
  path: true,
  eggId: true,
  reward: true,
  protocol: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

export type InsertEggBreak = z.infer<typeof insertEggBreakSchema>;
export type EggBreak = typeof eggBreaks.$inferSelect;

export type InsertCustomLink = z.infer<typeof insertCustomLinkSchema>;
export type CustomLink = typeof customLinks.$inferSelect;

// Game state type (not stored in DB)
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
  reward: number | string; // Cho phép cả số và text
  winningRate: number;
  allowed?: boolean;
}

// Admin request/response types
export interface UpdateEggRequest {
  eggId: number;
  reward: number | string; // Cho phép cả số và text
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
  reward: number | string; // Cho phép cả số và text
  used: boolean;
  protocol: string;
  createdAt: string;
}

// Global win rate configuration
export interface GlobalWinRateConfig {
  enabled: boolean;
  globalWinRate: number; // Global win percentage (0-100)
  useGroups: boolean; // Whether to use custom groups instead of global rate
  winRateSystemEnabled: boolean; // NEW: Master toggle for win rate system (ON/OFF)
  groups?: {
    groupA: {
      winRate: number; // Win rate for Group A (0-100)
      eggIds: number[]; // Array of egg IDs assigned to Group A
    };
    groupB: {
      winRate: number; // Win rate for Group B (0-100)
      eggIds: number[]; // Array of egg IDs assigned to Group B
    };
  };
}

// Request types for global win rate management
export interface UpdateGlobalWinRateRequest {
  enabled?: boolean;
  globalWinRate?: number;
  useGroups?: boolean;
  winRateSystemEnabled?: boolean; // NEW: Master toggle for win rate system
  groups?: {
    groupA: {
      winRate: number;
      eggIds: number[];
    };
    groupB: {
      winRate: number;
      eggIds: number[];
    };
  };
}

export interface BulkUpdateWinRatesRequest {
  winningRate: number;
}

export interface BulkUpdateRewardsRequest {
  reward: number | string;
}

// Thêm các interface mới
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
  reward: number | string; // Cho phép cả số và text
  success: boolean;
}
