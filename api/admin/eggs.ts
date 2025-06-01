import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage for testing
const eggs = [
  { id: 1, reward: 100, broken: false, winningRate: 100 },
  { id: 2, reward: 200, broken: false, winningRate: 100 },
  { id: 3, reward: 150, broken: false, winningRate: 100 },
  { id: 4, reward: 300, broken: false, winningRate: 100 },
  { id: 5, reward: 250, broken: false, winningRate: 100 },
  { id: 6, reward: 400, broken: false, winningRate: 100 },
  { id: 7, reward: 350, broken: false, winningRate: 100 },
  { id: 8, reward: 500, broken: false, winningRate: 100 }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`Admin eggs API called: ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle GET request - return all eggs
    if (req.method === 'GET') {
      console.log(`🥚 Returning ${eggs.length} eggs`);
      return res.status(200).json(eggs);
    }

    // Handle POST request - update egg
    if (req.method === 'POST') {
      const { eggId, reward, winningRate } = req.body;
      
      console.log(`🥚 Updating egg ${eggId}: reward=${reward}, winningRate=${winningRate}`);
      
      // Find and update egg
      const eggIndex = eggs.findIndex(egg => egg.id === eggId);
      if (eggIndex === -1) {
        return res.status(404).json({ message: `Egg with ID ${eggId} not found` });
      }
      
      eggs[eggIndex].reward = reward;
      eggs[eggIndex].winningRate = winningRate;
      
      console.log(`✅ Egg ${eggId} updated successfully`);
      return res.status(200).json(eggs[eggIndex]);
    }

    // Method not allowed
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error("❌ Admin eggs API error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
