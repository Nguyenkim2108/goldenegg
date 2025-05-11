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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomLinkSchema = createInsertSchema(customLinks).pick({
  userId: true,
  domain: true,
  subdomain: true,
  path: true,
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
}

export interface EggData {
  id: number;
  broken: boolean;
  reward: number;
}

// Leaderboard entry type
export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
}

// Admin request/response types
export interface UpdateEggRequest {
  eggId: number;
  reward: number;
}

export interface CreateLinkRequest {
  domain: string;
  subdomain: string;
  path?: string;
}

export interface LinkResponse {
  id: number;
  fullUrl: string;
  subdomain: string;
  domain: string;
  path: string;
  active: boolean;
  createdAt: string;
}
