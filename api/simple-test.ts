// Simple test endpoint without any imports
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Simple test endpoint called");
    
    res.status(200).json({
      message: "Simple API test working!",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      success: true
    });
  } catch (error) {
    console.error("Simple test error:", error);
    res.status(500).json({
      message: "Simple test failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
