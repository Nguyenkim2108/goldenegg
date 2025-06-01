import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`API called: ${req.method} ${req.url}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle different routes
    if (req.url === '/api/test' || req.url === '/test') {
      return res.status(200).json({
        message: "API is working!",
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        success: true
      });
    }

    if (req.url === '/api/health' || req.url === '/health') {
      return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    }

    // Default response
    res.status(200).json({
      message: "Vercel API function is working",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
