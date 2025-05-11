import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Game state endpoint
  app.get("/api/game-state", async (req, res) => {
    try {
      const gameState = await storage.getGameState();
      res.json(gameState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get game state";
      res.status(500).json({ message });
    }
  });
  
  // Leaderboard endpoint
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get leaderboard";
      res.status(500).json({ message });
    }
  });
  
  // Break egg endpoint
  app.post("/api/break-egg", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        eggId: z.number().int().min(1).max(9),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid egg ID" });
      }
      
      const { eggId } = result.data;
      
      // Process egg break
      const breakResult = await storage.breakEgg(eggId);
      res.json(breakResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to break egg";
      res.status(500).json({ message });
    }
  });
  
  // Claim rewards endpoint
  app.post("/api/claim-rewards", async (req, res) => {
    try {
      const result = await storage.claimRewards();
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to claim rewards";
      res.status(500).json({ message });
    }
  });
  
  // Reset game endpoint
  app.post("/api/reset-game", async (req, res) => {
    try {
      await storage.resetGame();
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset game";
      res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
