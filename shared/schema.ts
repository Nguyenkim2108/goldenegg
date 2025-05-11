import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  score: integer("score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

export type InsertEggBreak = z.infer<typeof insertEggBreakSchema>;
export type EggBreak = typeof eggBreaks.$inferSelect;

// Game state type (not stored in DB)
export interface GameState {
  deadline: number;
  brokenEggs: number[];
  progress: number;
}

// Leaderboard entry type
export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
}
