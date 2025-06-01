import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { UpdateEggRequest, CreateLinkRequest, BreakEggByLinkRequest, SetEggBrokenStateRequest } from "../shared/types";

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
  
  // Game state endpoint - thêm tham số linkId
  app.get("/api/game-state", async (req, res) => {
    try {
      // Nhận linkId từ query parameter
      const linkId = req.query.linkId ? parseInt(req.query.linkId as string, 10) : undefined;
      const gameState = await storage.getGameState(linkId);
      res.json(gameState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get game state";
      res.status(500).json({ message });
    }
  });
  
  // Break egg endpoint - thêm tham số linkId
  app.post("/api/break-egg", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        eggId: z.number().int().min(1).max(8), // Cập nhật từ 9 xuống 8
        linkId: z.number().int().optional()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid egg ID" });
      }
      
      const { eggId, linkId } = result.data;
      
      // Process egg break
      const breakResult = await storage.breakEgg(eggId, linkId);

      // Nếu có linkId, tiết lộ tất cả các quả trứng khác
      if (linkId) {
        const revealResult = await storage.revealAllEggs(linkId, eggId, breakResult.reward);
        return res.json(revealResult);
      }

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
      console.log("Received update-egg request:", req.body);

      // Validate request body
      const schema = z.object({
        eggId: z.number().int().min(1).max(8), // Cập nhật từ 9 xuống 8
        reward: z.union([z.number().min(0), z.string().min(1)]), // Cho phép cả số và string (string tối thiểu 1 ký tự)
        winningRate: z.number().min(0).max(100)
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error);
        console.error("Request body:", req.body);
        return res.status(400).json({
          message: "Invalid request",
          details: result.error.format()
        });
      }
      
      const { eggId, reward, winningRate } = result.data;
      
      // Update egg reward and winning rate
      const updatedEgg = await storage.updateEggReward(eggId, reward, winningRate);
      res.json(updatedEgg);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update egg";
      res.status(500).json({ message });
    }
  });
  
  // Set egg broken state (admin only)
  app.post("/api/admin/set-egg-broken", requireAdmin, async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        eggId: z.number().int().min(1).max(8), // Cập nhật từ 9 xuống 8
        broken: z.boolean()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request" });
      }
      
      const { eggId, broken } = result.data;
      
      // Update egg broken state
      const updatedEgg = await storage.setEggBrokenState(eggId, broken);
      res.json(updatedEgg);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update egg state";
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
  
  // Create custom link (admin only) - cập nhật để không cần reward
  app.post("/api/admin/create-link", requireAdmin, async (req, res) => {
    try {
      console.log("Received create-link request:", req.body);
      
      // Validate request body
      const schema = z.object({
        domain: z.string().min(1),
        subdomain: z.string().optional().default(""),
        path: z.string().optional().default(""),
        eggId: z.number().int().min(0).max(9).optional().default(0),
        protocol: z.string().optional().default("https")
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({ 
          message: "Invalid request", 
          details: result.error.format() 
        });
      }
      
      const linkData: CreateLinkRequest = {
        domain: result.data.domain,
        subdomain: result.data.subdomain || "",
        path: result.data.path || "",
        eggId: result.data.eggId || 0,
        protocol: result.data.protocol || "https"
      };
      
      console.log("Validated link data:", linkData);
      
      // Create custom link
      const link = await storage.createCustomLink(linkData);
      console.log("Link created successfully:", link);
      res.json(link);
    } catch (error) {
      console.error("Error creating link:", error);
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

  return createServer(app);
}
