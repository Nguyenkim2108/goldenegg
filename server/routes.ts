import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { UpdateEggRequest, CreateLinkRequest } from "@shared/schema";

// Auth middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // For now, skip auth in development
  // In a real app, you would check for a valid session
  next();
};

// Admin middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // For now, skip admin check in development
  // In a real app, you would check if the user is an admin
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ----------- Public Routes -----------
  
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

  // ----------- Auth Routes -----------
  
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const { username, password } = result.data;
      
      // Hardcoded admin login for demo
      if (username === "admin" && password === "admin123") {
        return res.json({ 
          id: 1, 
          username: "admin", 
          isAdmin: true,
          success: true 
        });
      }
      
      // Other login logic can go here
      res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to login";
      res.status(500).json({ message });
    }
  });
  
  // ----------- Admin Routes -----------
  
  // Get all eggs (admin only)
  app.get("/api/admin/eggs", requireAdmin, async (req, res) => {
    try {
      const eggs = await storage.getAllEggs();
      res.json(eggs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get eggs";
      res.status(500).json({ message });
    }
  });
  
  // Update egg reward (admin only)
  app.post("/api/admin/update-egg", requireAdmin, async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        eggId: z.number().int().min(1).max(9),
        reward: z.number().positive(),
      }) satisfies z.ZodType<UpdateEggRequest>;
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request" });
      }
      
      const { eggId, reward } = result.data;
      
      // Update egg reward
      const updatedEgg = await storage.updateEggReward(eggId, reward);
      res.json(updatedEgg);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update egg";
      res.status(500).json({ message });
    }
  });
  
  // Get all custom links (admin only)
  app.get("/api/admin/links", requireAdmin, async (req, res) => {
    try {
      const links = await storage.getCustomLinks();
      res.json(links);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get links";
      res.status(500).json({ message });
    }
  });
  
  // Create custom link (admin only)
  app.post("/api/admin/create-link", requireAdmin, async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        domain: z.string().min(1),
        subdomain: z.string().min(1),
        path: z.string().optional(),
      }) satisfies z.ZodType<CreateLinkRequest>;
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request" });
      }
      
      // Create custom link
      const link = await storage.createCustomLink(result.data);
      res.json(link);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create link";
      res.status(500).json({ message });
    }
  });
  
  // Delete custom link (admin only)
  app.delete("/api/admin/links/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid link ID" });
      }
      
      // Delete custom link
      const success = await storage.deleteCustomLink(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Link not found" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete link";
      res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
