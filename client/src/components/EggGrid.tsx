import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface EggGridProps {
  brokenEggs: number[];
  onEggClick: (eggId: number) => void;
}

interface EggData {
  id: number;
  broken: boolean;
  reward: number;
}

const EggGrid = ({ brokenEggs, onEggClick }: EggGridProps) => {
  // Get game state to access egg rewards
  const { data: gameData } = useQuery({
    queryKey: ["/api/game-state"],
  });

  const [eggs, setEggs] = useState<EggData[]>([]);
  
  // Generate predefined rewards to match the image example
  const predefinedRewards = {
    1: 1888.00,
    2: 288.00,
    3: 188.00,
    4: 688.00,
    5: 388.00,
    6: 88.00,
    7: 888.00,
    8: 5789.00,
    9: 388.00
  };
  
  useEffect(() => {
    // Initialize eggs with predefined rewards
    const initialEggs = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      broken: brokenEggs.includes(i + 1),
      reward: predefinedRewards[i + 1 as keyof typeof predefinedRewards] || Math.floor(Math.random() * (1000 - 50 + 1) + 50)
    }));
    
    setEggs(initialEggs);
  }, []);

  // Update eggs when brokenEggs changes
  useEffect(() => {
    setEggs(prev => prev.map(egg => ({
      ...egg,
      broken: brokenEggs.includes(egg.id)
    })));
  }, [brokenEggs]);

  // Animation variants for eggs
  const eggVariants = {
    idle: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
    tap: {
      scale: 0.9,
    },
    broken: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 },
    },
  };

  // Format reward to display with K for thousands or as is for smaller numbers
  const formatReward = (reward: number) => {
    return reward.toFixed(2);
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {eggs.map((egg) => (
        <div 
          key={egg.id} 
          className="relative flex flex-col items-center"
          onClick={() => !egg.broken && onEggClick(egg.id)}
        >
          <motion.div
            className="w-full cursor-pointer relative"
            variants={eggVariants}
            animate={egg.broken ? "broken" : "idle"}
            whileTap="tap"
          >
            {/* Egg SVG */}
            {egg.broken ? (
              // Broken egg with reward display
              <div className="relative">
                {/* Glow effect for broken egg */}
                <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-md"></div>
                
                {/* Broken egg shell */}
                <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-lg relative z-10">
                  {/* Red pedestal */}
                  <ellipse cx="50" cy="100" rx="30" ry="10" fill="#E62E2E" />
                  
                  {/* Broken top part */}
                  <path d="M35,60 C35,40 65,40 65,60 L60,75 L40,75 Z" fill="url(#goldGradient)" />
                  
                  {/* Broken bottom part */}
                  <path d="M30,80 C30,95 70,95 70,80 L65,75 L58,85 L50,73 L42,85 L35,75 Z" fill="url(#goldGradient)" />
                  
                  {/* Gold gradient definition */}
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF9C4" />
                      <stop offset="25%" stopColor="#FFF176" />
                      <stop offset="50%" stopColor="#FFD700" />
                      <stop offset="75%" stopColor="#FFC107" />
                      <stop offset="100%" stopColor="#FF8F00" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Reward text on broken egg */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-[#E62E2E] bg-opacity-90 rounded-lg px-1 py-0.5">
                    <div className="text-xs text-white font-bold">{formatReward(egg.reward)}</div>
                    <div className="text-[10px] text-white">Thưởng</div>
                  </div>
                </div>
              </div>
            ) : (
              // Intact egg
              <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-lg">
                {/* Red pedestal */}
                <ellipse cx="50" cy="100" rx="30" ry="10" fill="#E62E2E" />
                
                {/* Golden egg */}
                <ellipse cx="50" cy="50" rx="30" ry="40" fill="url(#goldGradient)" />
                
                {/* Egg shine */}
                <ellipse cx="40" cy="35" rx="10" ry="15" fill="rgba(255, 255, 255, 0.5)" />
                
                {/* Egg shadow */}
                <ellipse cx="50" cy="95" rx="25" ry="5" fill="rgba(0, 0, 0, 0.3)" />
                
                {/* Gold gradient definition */}
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF9C4" />
                    <stop offset="25%" stopColor="#FFF176" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="75%" stopColor="#FFC107" />
                    <stop offset="100%" stopColor="#FF8F00" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </motion.div>
          
          <div className="mt-1 px-2 py-0.5 bg-[hsl(var(--red-primary))]/90 rounded text-xs text-white text-center w-full">
            <span>Phần Thưởng</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EggGrid;
