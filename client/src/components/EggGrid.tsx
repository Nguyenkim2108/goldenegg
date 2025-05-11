import { motion } from "framer-motion";
import { useState } from "react";

interface EggGridProps {
  brokenEggs: number[];
  onEggClick: (eggId: number) => void;
}

const EggGrid = ({ brokenEggs, onEggClick }: EggGridProps) => {
  // Total of 9 eggs arranged in 3x3 grid
  const eggs = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    broken: brokenEggs.includes(i + 1),
  }));

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

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {eggs.map((egg) => (
        <div 
          key={egg.id} 
          className="relative flex flex-col items-center"
          onClick={() => !egg.broken && onEggClick(egg.id)}
        >
          <motion.div
            className="w-full cursor-pointer"
            variants={eggVariants}
            animate={egg.broken ? "broken" : "idle"}
            whileTap="tap"
          >
            {/* Egg SVG */}
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
