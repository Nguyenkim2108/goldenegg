import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage for testing
const links = [
  {
    id: 1,
    domain: "",
    subdomain: "test",
    path: "",
    fullUrl: "test.viral-media-hub.vercel.app",
    active: true,
    eggId: 1,
    reward: 100,
    used: false,
    protocol: "https",
    createdAt: new Date().toISOString()
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`Admin links API called: ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle GET request - return all links
    if (req.method === 'GET') {
      console.log(`🔗 Returning ${links.length} links`);
      return res.status(200).json(links);
    }

    // Handle POST request - create new link
    if (req.method === 'POST') {
      const { domain, subdomain, path, eggId, protocol } = req.body;
      
      console.log(`🔗 Creating new link: ${subdomain}.${domain || 'viral-media-hub.vercel.app'}`);
      
      const newLink = {
        id: links.length + 1,
        domain: domain || "",
        subdomain,
        path: path || "",
        fullUrl: domain ? `${subdomain}.${domain}` : `${subdomain}.viral-media-hub.vercel.app`,
        active: true,
        eggId,
        reward: 100, // Default reward
        used: false,
        protocol: protocol || "https",
        createdAt: new Date().toISOString()
      };
      
      links.push(newLink);
      
      console.log(`✅ Link created successfully: ${newLink.fullUrl}`);
      return res.status(201).json(newLink);
    }

    // Method not allowed
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error("❌ Admin links API error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
