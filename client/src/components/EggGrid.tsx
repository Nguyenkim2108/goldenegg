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
  
  // Fetch egg data from Game component
  useEffect(() => {
    // Get data from the API
    const fetchEggData = async () => {
      try {
        const response = await fetch('/api/admin/eggs');
        if (response.ok) {
          const eggData = await response.json();
          const mappedEggs = eggData.map((egg: any) => ({
            id: egg.id,
            broken: brokenEggs.includes(egg.id),
            reward: egg.reward,
          }));
          setEggs(mappedEggs);
        }
      } catch (error) {
        console.error('Error fetching egg data:', error);
        // Fallback to initialize with empty rewards if API fails
        const initialEggs = Array.from({ length: 9 }, (_, i) => ({
          id: i + 1,
          broken: brokenEggs.includes(i + 1),
          reward: 100 + (i * 50)
        }));
        setEggs(initialEggs);
      }
    };
    
    fetchEggData();
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
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
    tap: {
      scale: 0.95,
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
    <div className="grid grid-cols-3 gap-2 mb-4">
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
                <div className="absolute -inset-2 bg-[#FFD700]/30 rounded-full blur-lg animate-pulse"></div>
                
                {/* Broken egg shell */}
                <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl relative z-10">
                  {/* Red pedestal */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  
                  <defs>
                    <radialGradient id="redGlow" cx="50%" cy="100%" r="50%" fx="50%" fy="90%">
                      <stop offset="0%" stopColor="#FF5252" />
                      <stop offset="100%" stopColor="#B71C1C" />
                    </radialGradient>
                  </defs>
                  
                  {/* Red pedestal with glow */}
                  <ellipse cx="50" cy="100" rx="30" ry="10" fill="url(#redGlow)" filter="url(#glow)" />
                  
                  {/* Broken top part */}
                  <path d="M35,60 C35,40 65,40 65,60 L60,75 L40,75 Z" fill="url(#goldGradient)" />
                  
                  {/* Broken bottom part */}
                  <path d="M30,80 C30,95 70,95 70,80 L65,75 L58,85 L50,73 L42,85 L35,75 Z" fill="url(#goldGradient)" />
                  
                  {/* Gold sparkles */}
                  <circle cx="30" cy="60" r="1" fill="white">
                    <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70" cy="60" r="1.5" fill="white">
                    <animate attributeName="opacity" values="0;1;0" dur="1.7s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="40" cy="75" r="1" fill="white">
                    <animate attributeName="opacity" values="0;1;0" dur="2.3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="60" cy="80" r="1.2" fill="white">
                    <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Gold gradient definition with shimmer */}
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF9C4">
                        <animate attributeName="stop-color" values="#FFF9C4;#FFECB3;#FFF9C4" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="25%" stopColor="#FFF176">
                        <animate attributeName="stop-color" values="#FFF176;#FFD54F;#FFF176" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor="#FFD700">
                        <animate attributeName="stop-color" values="#FFD700;#FFC107;#FFD700" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="75%" stopColor="#FFC107">
                        <animate attributeName="stop-color" values="#FFC107;#FFB300;#FFC107" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#FF8F00">
                        <animate attributeName="stop-color" values="#FF8F00;#FF6F00;#FF8F00" dur="2s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Reward text on broken egg */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-[#E62E2E] bg-opacity-90 rounded-lg px-3 py-1 z-20">
                    <div className="text-sm text-white font-bold">{formatReward(egg.reward)}</div>
                    <div className="text-xs text-white">Thưởng</div>
                  </div>
                </div>
              </div>
            ) : (
              // Intact egg
              <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl">
                {/* Add glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <defs>
                  <radialGradient id="redGlow" cx="50%" cy="100%" r="50%" fx="50%" fy="90%">
                    <stop offset="0%" stopColor="#FF5252" />
                    <stop offset="100%" stopColor="#B71C1C" />
                  </radialGradient>
                </defs>
                
                {/* Red pedestal with glow */}
                <ellipse cx="50" cy="100" rx="30" ry="10" fill="url(#redGlow)" filter="url(#glow)" />
                
                {/* Golden egg */}
                <ellipse cx="50" cy="50" rx="30" ry="40" fill="url(#goldShimmer)" />
                
                {/* Egg shine */}
                <ellipse cx="40" cy="35" rx="10" ry="15" fill="rgba(255, 255, 255, 0.5)" />
                
                {/* Egg shadow */}
                <ellipse cx="50" cy="95" rx="25" ry="5" fill="rgba(0, 0, 0, 0.3)" />
                
                {/* Gold sparkles */}
                <circle cx="35" cy="30" r="1" fill="white">
                  <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="65" cy="40" r="1.5" fill="white">
                  <animate attributeName="opacity" values="0;1;0" dur="1.7s" repeatCount="indefinite" />
                </circle>
                <circle cx="55" cy="25" r="1" fill="white">
                  <animate attributeName="opacity" values="0;1;0" dur="2.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="40" cy="65" r="1.2" fill="white">
                  <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                
                {/* Gold gradient definition with shimmer animation */}
                <defs>
                  <linearGradient id="goldShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF9C4">
                      <animate attributeName="stop-color" values="#FFF9C4;#FFECB3;#FFF9C4" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="25%" stopColor="#FFF176">
                      <animate attributeName="stop-color" values="#FFF176;#FFD54F;#FFF176" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor="#FFD700">
                      <animate attributeName="stop-color" values="#FFD700;#FFC107;#FFD700" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="75%" stopColor="#FFC107">
                      <animate attributeName="stop-color" values="#FFC107;#FFB300;#FFC107" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#FF8F00">
                      <animate attributeName="stop-color" values="#FF8F00;#FF6F00;#FF8F00" dur="2s" repeatCount="indefinite" />
                    </stop>
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
