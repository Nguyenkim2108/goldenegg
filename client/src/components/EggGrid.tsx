import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface EggGridProps {
  brokenEggs: number[];
  onEggClick: (eggId: number) => void;
  eggRewards: {[key: number]: number | string};
  allEggsRevealed: boolean;
  allowedEggId?: number;
}

interface EggData {
  id: number;
  broken: boolean;
  reward: number;
  allowed?: boolean;
}

const EggGrid = ({ brokenEggs, onEggClick, eggRewards, allEggsRevealed, allowedEggId }: EggGridProps) => {
  const [eggs, setEggs] = useState<EggData[]>([]);


  
  // Fetch egg data from Game component
  useEffect(() => {
    // Get data from the API
    const fetchEggData = async () => {
      try {
        const response = await fetch('/api/admin/eggs');
        if (response.ok) {
          const eggData = await response.json();
          const mappedEggs = eggData.slice(0, 8).map((egg: any) => ({
            id: egg.id,
            broken: brokenEggs.includes(egg.id),
            reward: egg.reward,
            allowed: allowedEggId ? egg.id === allowedEggId : undefined
          }));
          setEggs(mappedEggs);
        }
      } catch (error) {
        console.error('Error fetching egg data:', error);
        // Fallback to initialize with empty rewards if API fails
        const initialEggs = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          broken: brokenEggs.includes(i + 1),
          reward: 100 + (i * 50),
          allowed: allowedEggId ? (i + 1) === allowedEggId : undefined
        }));
        setEggs(initialEggs);
      }
    };
    
    fetchEggData();
  }, [allowedEggId]);

  // Update eggs when brokenEggs changes or allEggsRevealed changes
  useEffect(() => {
    setEggs(prev => prev.map(egg => ({
      ...egg,
      broken: brokenEggs.includes(egg.id),
      // Cập nhật reward từ eggRewards nếu có
      reward: eggRewards[egg.id] !== undefined ? eggRewards[egg.id] : egg.reward
    })));
  }, [brokenEggs, eggRewards]);

  // Animation variants for eggs
  const eggVariants = {
    idle: {
      y: [0, -5, 0],
      rotate: [0, 1, 0, -1, 0],
      filter: "drop-shadow(0 5px 15px rgba(255, 215, 0, 0.3))",
      transition: {
        y: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
        rotate: {
          duration: 5,
          repeat: Infinity,
          repeatType: "loop" as const,
        },
        filter: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" as const,
        }
      },
    },
    hover: {
      y: -10,
      scale: 1.08,
      rotate: [0, 2, 0, -2, 0],
      filter: "drop-shadow(0 10px 20px rgba(255, 215, 0, 0.5))",
      transition: { 
        duration: 0.3,
        rotate: {
          duration: 1.5,
          repeat: Infinity,
        }
      }
    },
    tap: {
      scale: 0.95,
      rotate: [0, 0, -5],
      filter: "drop-shadow(0 3px 5px rgba(255, 215, 0, 0.4))",
      transition: { duration: 0.2 }
    },
    broken: {
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 3, 0],
      filter: "drop-shadow(0 8px 25px rgba(255, 215, 0, 0.6))",
      transition: { duration: 0.8 },
    },
  };

  // Format reward to display with K for thousands or as is for smaller numbers
  const formatReward = (reward: number | string) => {
    if (typeof reward === 'string') {
      return reward;
    }
    return reward.toFixed(2);
  };

  // Chia các quả trứng thành các hàng
  const eggRows = [
    eggs.slice(0, 2), // Hàng 1: 2 quả trứng ở giữa
    eggs.slice(2, 5), // Hàng 2: 3 quả trứng
    eggs.slice(5, 8)  // Hàng 3: 3 quả trứng
  ];

  return (
    <div className="flex flex-col gap-2 mb-4">
      {eggRows.map((row, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className={`grid gap-2 ${rowIndex === 0 ? 'grid-cols-2 w-2/3 mx-auto' : 'grid-cols-3 w-full'}`}
        >
          {row.map((egg) => (
        <div 
          key={egg.id} 
          className="relative flex flex-col items-center"
          onClick={() => !egg.broken && onEggClick(egg.id)}
        >
              {/* Hiển thị đèn báo cho trứng được phép đập */}
              {allowedEggId === egg.id && !egg.broken && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full animate-pulse z-10">
                  <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                </div>
              )}
              
          <motion.div
                className={`w-full cursor-pointer relative transform-gpu ${allowedEggId && allowedEggId !== egg.id ? 'opacity-70' : ''}`}
            variants={eggVariants}
            animate={egg.broken ? "broken" : "idle"}
                whileHover="hover"
            whileTap="tap"
          >
            {/* Egg SVG */}
                {egg.broken || (allEggsRevealed && eggRewards[egg.id] !== undefined) ? (
              // Broken egg with reward display
              <div className="relative">
                    {/* Enhanced glow effect for broken egg */}
                    <div className="absolute -inset-4 bg-gradient-radial from-[#FFD700]/40 to-transparent rounded-full blur-xl"></div>
                <div className="absolute -inset-2 bg-[#FFD700]/30 rounded-full blur-lg animate-pulse"></div>
                
                    {/* Light rays animation */}
                    <div className="absolute inset-0">
                      {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map((angle, i) => (
                        <motion.div 
                          key={`ray-${i}`}
                          className="absolute w-[140%] h-[1px] bg-gradient-to-r from-[#FFD700]/0 via-[#FFD700]/60 to-[#FFD700]/0"
                          style={{ 
                            top: '50%', 
                            left: '50%', 
                            transformOrigin: 'left center',
                            transform: `rotate(${angle}deg) translateX(0%)` 
                          }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            scale: [0.6, 1.3, 0.6],
                          }}
                          transition={{
                            duration: 2 + (i % 4),
                            repeat: Infinity,
                            repeatType: "loop",
                            delay: i * 0.15
                          }}
                        />
                      ))}
                  </div>

                    {/* Magic particles floating effect */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          className="absolute w-1 h-1 rounded-full bg-white"
                          style={{
                            left: `${35 + Math.random() * 30}%`,
                            top: `${45 + Math.random() * 30}%`,
                          }}
                          animate={{
                            y: [0, -20, 0],
                            x: [0, Math.random() * 10 - 5, 0],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                </div>

                    {/* Broken egg shell - enhanced SVG */}
                <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl relative z-10">
                  <defs>
                        {/* Enhanced red pedestal gradient */}
                        <radialGradient id="enhancedRedGlow" cx="50%" cy="100%" r="50%" fx="50%" fy="90%">
                          <stop offset="0%" stopColor="#FF5252">
                            <animate attributeName="stop-color" values="#FF5252;#FF7676;#FF5252" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor="#B71C1C">
                            <animate attributeName="stop-color" values="#B71C1C;#D32F2F;#B71C1C" dur="3s" repeatCount="indefinite" />
                          </stop>
                    </radialGradient>
                        
                        {/* Ultra gold gradient with luxury vibrant colors */}
                        <linearGradient id="ultraGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF9C4">
                            <animate attributeName="stop-color" values="#FFF9C4;#FFECB3;#FFF9C4" dur="1.5s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="25%" stopColor="#FFF176">
                            <animate attributeName="stop-color" values="#FFF176;#FFD54F;#FFF176" dur="1.7s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor="#FFD700">
                        <animate attributeName="stop-color" values="#FFD700;#FFC107;#FFD700" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="75%" stopColor="#FFC107">
                            <animate attributeName="stop-color" values="#FFC107;#FFB300;#FFC107" dur="1.8s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#FF8F00">
                            <animate attributeName="stop-color" values="#FF8F00;#FF6F00;#FF8F00" dur="1.6s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                        
                        {/* Add a pattern for texture on the gold */}
                        <pattern id="goldPattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="10" stroke="#FFF9C4" strokeWidth="10" strokeOpacity="0.1" />
                        </pattern>
                        
                        {/* Combined fill for gold texture */}
                        <linearGradient id="texturedGold">
                          <stop offset="0%" stopColor="url(#ultraGoldGradient)" />
                          <stop offset="100%" stopColor="url(#goldPattern)" />
                        </linearGradient>
                        
                        {/* Advanced glow filter */}
                        <filter id="advancedGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="6" result="blur" />
                          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 1  0 0 1 0 0.8  0 0 0 1 0" result="brightGlow" />
                          <feBlend in="SourceGraphic" in2="brightGlow" mode="screen" />
                        </filter>
                  </defs>
                      
                      {/* Magical aura around pedestal */}
                      <ellipse cx="50" cy="100" rx="45" ry="15" fill="url(#enhancedRedGlow)" opacity="0.2" filter="url(#advancedGlow)" />
                      
                      {/* Enhanced red pedestal with glow and texture */}
                      <ellipse cx="50" cy="100" rx="36" ry="12" fill="url(#enhancedRedGlow)" filter="url(#advancedGlow)" />
                      
                      {/* Pedestal texture details */}
                      <path d="M30,100 Q50,92 70,100 Q50,104 30,100 Z" fill="#FFFFFF" opacity="0.1" />
                      
                      {/* Shadow under egg */}
                      <ellipse cx="50" cy="100" rx="28" ry="8" fill="rgba(0,0,0,0.4)" />
                      
                      {/* Broken top part - with enhanced detail and animation */}
                      <motion.path 
                        d="M35,60 C35,40 65,40 65,60 L60,75 L40,75 Z" 
                        fill="url(#ultraGoldGradient)"
                        animate={{ 
                          y: [-3, 0, -3],
                          rotate: [2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                      
                      {/* Top part texture details */}
                      <motion.path 
                        d="M40,45 Q50,38 60,45 Q50,48 40,45 Z" 
                        fill="#FFFFFF" 
                        opacity="0.2"
                        animate={{
                          opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                      
                      {/* Broken bottom part with enhanced details */}
                      <motion.path 
                        d="M30,80 C30,95 70,95 70,80 L65,75 L58,85 L50,73 L42,85 L35,75 Z" 
                        fill="url(#ultraGoldGradient)"
                        animate={{ 
                          y: [1, 0, 1],
                          rotate: [-1, 0, 1, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity, 
                          repeatType: "reverse"
                        }}
                      />
                      
                      {/* Bottom part texture details */}
                      <motion.path 
                        d="M37,82 Q50,78 63,82 Q50,85 37,82 Z" 
                        fill="#FFFFFF" 
                        opacity="0.15"
                        animate={{
                          opacity: [0.1, 0.25, 0.1]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity
                        }}
                      />
                      
                      {/* Enhanced gold treasures spilling out with animations */}
                      <motion.circle 
                        cx="40" cy="68" r="4" 
                        fill="url(#ultraGoldGradient)"
                        animate={{ y: [0, 5, 0], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.circle 
                        cx="58" cy="70" r="5" 
                        fill="url(#ultraGoldGradient)"
                        animate={{ y: [0, 3, 0], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.7, repeat: Infinity, delay: 0.3 }}
                      />
                      <motion.circle 
                        cx="50" cy="65" r="6" 
                        fill="url(#ultraGoldGradient)"
                        animate={{ y: [0, 4, 0], opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                      />
                      
                      {/* Add starbursts/twinkles to the gold */}
                      <motion.path 
                        d="M40,68 L38,64 L42,64 Z" 
                        fill="#FFFFFF"
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.path 
                        d="M58,69 L56,65 L60,65 Z" 
                        fill="#FFFFFF"
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                      />
                      
                      {/* Enhanced gold sparkles with more variety and animation */}
                      {[
                        { cx: 30, cy: 60, r: 1, dur: "2s", delay: "0s", amplitude: 0.5 },
                        { cx: 70, cy: 60, r: 1.5, dur: "1.7s", delay: "0.2s", amplitude: 0.7 },
                        { cx: 40, cy: 75, r: 1, dur: "2.3s", delay: "0.4s", amplitude: 0.3 },
                        { cx: 60, cy: 80, r: 1.2, dur: "1.8s", delay: "0.6s", amplitude: 0.6 },
                        { cx: 50, cy: 55, r: 1.3, dur: "2.1s", delay: "0.3s", amplitude: 0.4 },
                        { cx: 45, cy: 70, r: 1.1, dur: "1.9s", delay: "0.5s", amplitude: 0.5 },
                        { cx: 35, cy: 65, r: 0.8, dur: "2.2s", delay: "0.7s", amplitude: 0.3 },
                        { cx: 65, cy: 70, r: 0.9, dur: "1.6s", delay: "0.1s", amplitude: 0.4 }
                      ].map((sparkle, i) => (
                        <motion.circle 
                          key={i} 
                          cx={sparkle.cx} 
                          cy={sparkle.cy} 
                          r={sparkle.r}
                          fill="white"
                          animate={{
                            opacity: [0, 1, 0],
                            r: [sparkle.r, sparkle.r * 1.8, sparkle.r],
                            x: [0, Math.random() > 0.5 ? sparkle.amplitude : -sparkle.amplitude, 0]
                          }}
                          transition={{
                            duration: parseInt(sparkle.dur),
                            delay: parseFloat(sparkle.delay),
                            repeat: Infinity
                          }}
                        />
                      ))}
                </svg>
                
                    {/* Hiển thị số tiền thưởng với hiệu ứng 3D nâng cao */}
                <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        className={`text-center ${egg.broken 
                          ? 'bg-gradient-to-br from-[#E62E2E] to-[#B71C1C]' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-900'} 
                          bg-opacity-90 rounded-lg px-3 py-2 z-20 shadow-lg backdrop-blur-sm`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                          y: [0, -3, 0],
                          boxShadow: egg.broken 
                            ? ['0 0 10px 2px rgba(230, 46, 46, 0.3)', '0 0 15px 4px rgba(230, 46, 46, 0.6)', '0 0 10px 2px rgba(230, 46, 46, 0.3)']
                            : ['0 0 5px rgba(0,0,0,0.3)']
                        }}
                        transition={{ 
                          scale: { duration: 0.3 },
                          opacity: { duration: 0.3 },
                          y: { 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          },
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }
                        }}
                        style={{
                          border: egg.broken 
                            ? '1px solid rgba(255,255,255,0.3)' 
                            : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <motion.div
                          className="text-sm text-white font-bold"
                          animate={{
                            textShadow: egg.broken
                              ? ['0 0 0px rgba(255,255,255,0.3)', '0 0 8px rgba(255,255,255,0.6)', '0 0 0px rgba(255,255,255,0.3)']
                              : ['none']
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {(() => {
                            // Kiểm tra xem trứng có được tiết lộ không (đã vỡ hoặc tất cả đã được tiết lộ)
                            const isRevealed = egg.broken || (allEggsRevealed && eggRewards[egg.id] !== undefined);

                            if (isRevealed) {
                              // Sử dụng eggRewards nếu có, nếu không thì dùng egg.reward
                              const rewardToCheck = eggRewards[egg.id] !== undefined ? eggRewards[egg.id] : egg.reward;
                              return formatReward(rewardToCheck);
                            } else {
                              return 'Phần Thưởng';
                            }
                          })()}
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  // Intact golden egg with ultra enhanced 3D and lighting effects
                  <div className="relative">
                    {/* Enhanced background glow effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-radial from-[#FFD700]/30 to-[#FFD700]/0 rounded-[50%] blur-lg"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      style={{
                        transform: "translateY(-5%) scale(1.2)",
                      }}
                    />
                    
                    {/* Magic particles floating around egg */}
                    <div className="absolute inset-0">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={`glow-particle-${i}`}
                          className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
                          style={{
                            left: `${45 + Math.random() * 10}%`,
                            top: `${40 + Math.random() * 20}%`,
                          }}
                          animate={{
                            y: [0, -15, 0],
                            x: [0, Math.random() * 10 - 5, 0],
                            opacity: [0, 0.7, 0],
                            scale: [0, 1.5, 0],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                          }}
                        />
                      ))}
                </div>

                    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl relative z-10">
                      {/* Enhanced glow filter */}
                      <filter id="enhancedGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 0.9  0 0 1 0 0.3  0 0 0 1 0" result="goldenGlow" />
                        <feBlend in="SourceGraphic" in2="goldenGlow" mode="screen" />
                </filter>
                
                <defs>
                        {/* Enhanced red pedestal gradient */}
                        <radialGradient id="enhancedRedGlow" cx="50%" cy="100%" r="50%" fx="50%" fy="90%">
                          <stop offset="0%" stopColor="#FF5252">
                            <animate attributeName="stop-color" values="#FF5252;#FF7676;#FF5252" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor="#B71C1C">
                            <animate attributeName="stop-color" values="#B71C1C;#D32F2F;#B71C1C" dur="3s" repeatCount="indefinite" />
                          </stop>
                  </radialGradient>
                        
                        {/* Ultra enhanced gold gradient with dynamic shimmer */}
                        <radialGradient id="ultraGoldShimmer" cx="50%" cy="40%" r="60%" fx="40%" fy="40%">
                          <stop offset="0%" stopColor="#FFF8E1">
                            <animate attributeName="stop-color" values="#FFF8E1;#FFECB3;#FFF8E1" dur="2s" repeatCount="indefinite" />
                    </stop>
                          <stop offset="30%" stopColor="#FFECB3">
                            <animate attributeName="stop-color" values="#FFECB3;#FFE082;#FFECB3" dur="2.2s" repeatCount="indefinite" />
                    </stop>
                          <stop offset="60%" stopColor="#FFD700">
                            <animate attributeName="stop-color" values="#FFD700;#FFC107;#FFD700" dur="2.5s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#FF8F00">
                            <animate attributeName="stop-color" values="#FF8F00;#F57F17;#FF8F00" dur="3s" repeatCount="indefinite" />
                    </stop>
                        </radialGradient>
                        
                        {/* Add pattern for egg texture */}
                        <pattern id="eggPattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="10" stroke="#FFFFFF" strokeWidth="10" strokeOpacity="0.1" />
                        </pattern>
                        
                        {/* Combined fill for texture */}
                        <linearGradient id="texturedGold">
                          <stop offset="0%" stopColor="url(#ultraGoldShimmer)" />
                          <stop offset="100%" stopColor="url(#eggPattern)" />
                  </linearGradient>
                </defs>
                      
                      {/* Magical aura around pedestal */}
                      <ellipse cx="50" cy="100" rx="42" ry="15" fill="url(#enhancedRedGlow)" opacity="0.2" filter="url(#enhancedGlow)" />
                      
                      {/* Enhanced red pedestal with glow */}
                      <ellipse cx="50" cy="100" rx="36" ry="12" fill="url(#enhancedRedGlow)" filter="url(#enhancedGlow)" />
                      
                      {/* Pedestal texture details */}
                      <path d="M30,100 Q50,92 70,100 Q50,104 30,100 Z" fill="#FFFFFF" opacity="0.1" />
                      
                      {/* Enhanced shadow under egg */}
                      <ellipse cx="50" cy="100" rx="28" ry="8" fill="rgba(0,0,0,0.4)" />
                      
                      {/* Golden egg with ultra 3D effect */}
                      <ellipse cx="50" cy="50" rx="32" ry="42" fill="url(#ultraGoldShimmer)" filter="url(#enhancedGlow)" />
                      
                      {/* Surface detail pattern on egg */}
                      <ellipse cx="50" cy="50" rx="32" ry="42" fill="url(#eggPattern)" fillOpacity="0.05" />
                      
                      {/* Egg highlights for enhanced 3D effect */}
                      <ellipse cx="38" cy="35" rx="14" ry="19" fill="rgba(255, 255, 255, 0.5)" />
                      <ellipse cx="35" cy="32" rx="5" ry="8" fill="rgba(255, 255, 255, 0.8)" />
                      <ellipse cx="64" cy="65" rx="10" ry="12" fill="rgba(0, 0, 0, 0.08)" />
                      
                      {/* Enhanced light reflection */}
                      <motion.path 
                        d="M62,35 A28,38 0 0,0 32,35 A28,38 0 0,0 62,35 Z" 
                        fill="rgba(255, 255, 255, 0.1)"
                        animate={{
                          opacity: [0.05, 0.15, 0.05]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity
                        }}
                      />
                      
                      {/* Enhanced gold sparkles with more magical feel */}
                      {[
                        { cx: 35, cy: 30, r: 1, dur: "2s", delay: "0s", amplitude: 0.5 },
                        { cx: 65, cy: 40, r: 1.5, dur: "1.7s", delay: "0.2s", amplitude: 0.7 },
                        { cx: 55, cy: 25, r: 1, dur: "2.3s", delay: "0.4s", amplitude: 0.3 },
                        { cx: 40, cy: 65, r: 1.2, dur: "1.8s", delay: "0.6s", amplitude: 0.6 },
                        { cx: 30, cy: 50, r: 1.3, dur: "2.1s", delay: "0.3s", amplitude: 0.4 },
                        { cx: 60, cy: 60, r: 1.1, dur: "1.9s", delay: "0.5s", amplitude: 0.5 },
                        { cx: 48, cy: 30, r: 0.8, dur: "2.2s", delay: "0.7s", amplitude: 0.3 },
                        { cx: 45, cy: 20, r: 0.9, dur: "1.6s", delay: "0.1s", amplitude: 0.4 },
                        { cx: 70, cy: 45, r: 1.0, dur: "2.5s", delay: "0.8s", amplitude: 0.6 }
                      ].map((sparkle, i) => (
                        <motion.circle 
                          key={i} 
                          cx={sparkle.cx} 
                          cy={sparkle.cy} 
                          r={sparkle.r}
                          fill="white"
                          animate={{
                            opacity: [0, 1, 0],
                            r: [sparkle.r, sparkle.r * 2, sparkle.r],
                            x: [0, Math.random() > 0.5 ? sparkle.amplitude : -sparkle.amplitude, 0]
                          }}
                          transition={{
                            duration: parseInt(sparkle.dur),
                            delay: parseFloat(sparkle.delay),
                            repeat: Infinity
                          }}
                        />
                      ))}
                      
                      {/* Star burst effects on the egg surface */}
                      {[
                        { x: 45, y: 35, delay: 0.5 },
                        { x: 60, y: 45, delay: 1.2 },
                        { x: 40, y: 50, delay: 2.1 }
                      ].map((star, i) => (
                        <motion.g 
                          key={`star-${i}`}
                          animate={{
                            opacity: [0, 0.7, 0],
                            scale: [0.5, 1.2, 0.5]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: star.delay,
                            repeatDelay: 3
                          }}
                        >
                          <path 
                            d={`M${star.x-3},${star.y} L${star.x},${star.y-8} L${star.x+3},${star.y} L${star.x+8},${star.y+3} L${star.x},${star.y+5} L${star.x-8},${star.y+3} Z`}
                            fill="rgba(255, 255, 255, 0.7)" 
                            stroke="rgba(255, 215, 0, 0.3)"
                            strokeWidth="0.5"
                          />
                        </motion.g>
                      ))}
              </svg>
                  </div>
            )}
          </motion.div>
          
              <motion.div 
                className={`mt-1 px-2 py-0.5 ${allowedEggId === egg.id 
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFC107]' 
                  : 'bg-gradient-to-r from-[#E53935] to-[#C62828]'} 
                  rounded-md text-xs text-white text-center w-full shadow-md`}
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: allowedEggId === egg.id 
                    ? ['0 0 0px rgba(255, 215, 0, 0)', '0 0 15px 3px rgba(255, 215, 0, 0.6)', '0 0 0px rgba(255, 215, 0, 0)']
                    : ['none'] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: allowedEggId === egg.id ? Infinity : 0
                }}
                style={{
                  border: allowedEggId === egg.id 
                    ? '1px solid rgba(255, 255, 255, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <motion.span
                  animate={allowedEggId === egg.id ? {
                    textShadow: ['0 0 0px rgba(255,255,255,0.3)', '0 0 3px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0.3)']
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {allowedEggId === egg.id ? 'Quả Trúng Thưởng' : 'Phần Thưởng'}
                </motion.span>
              </motion.div>
          </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EggGrid;
