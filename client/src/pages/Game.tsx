import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameState, LeaderboardEntry } from "@shared/schema";
import GameHeader from "@/components/GameHeader";
import CountdownTimer from "@/components/CountdownTimer";
import EggGrid from "@/components/EggGrid";
import LeaderboardSection from "@/components/LeaderboardSection";
import FooterNavigation from "@/components/FooterNavigation";
import RewardNotification from "@/components/RewardNotification";

const Game = () => {
  // Game state
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [brokenEggs, setBrokenEggs] = useState<number[]>([]);
  const [eggRewards, setEggRewards] = useState<{[key: number]: number}>({});

  // Fetch game state from server
  const { data: gameData, isLoading: gameLoading } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Break egg mutation
  const { mutate: breakEgg } = useMutation({
    mutationFn: async (eggId: number) => {
      const response = await apiRequest("POST", "/api/break-egg", { eggId });
      return response.json();
    },
    onSuccess: (data) => {
      // Update broken eggs
      setBrokenEggs((prev) => [...prev, data.eggId]);
      
      // Store egg reward
      setEggRewards(prev => ({
        ...prev,
        [data.eggId]: data.reward
      }));
      
      // Show reward notification
      setCurrentReward(data.reward);
      setShowReward(true);
      
      // Update progress
      const newProgress = (brokenEggs.length + 1) / 9 * 100;
      setProgress(newProgress);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Claim rewards mutation
  const { mutate: claimRewards } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/claim-rewards", {});
      return response.json();
    },
    onSuccess: () => {
      // Reset broken eggs and progress
      setBrokenEggs([]);
      setProgress(0);
      setEggRewards({});
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Handle egg click
  const handleEggClick = (eggId: number) => {
    if (!brokenEggs.includes(eggId)) {
      breakEgg(eggId);
    }
  };

  // Handle claim button click
  const handleClaimClick = () => {
    claimRewards();
  };

  // Calculate time remaining
  const deadline = gameData?.deadline || Date.now() + 24 * 60 * 60 * 1000; // Default 24h from now
  
  // Update UI when game state changes
  useEffect(() => {
    if (gameData && gameData.brokenEggs) {
      setBrokenEggs(gameData.brokenEggs);
      setProgress(gameData.progress || 0);
    }
  }, [gameData]);
  
  // Game background
  const gameBackground = "bg-gradient-to-b from-blue-900 to-blue-950";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--blue-dark))]">
      {/* Game Header */}
      <GameHeader />
      
      {/* Main Game Area */}
      <div className="relative w-full max-w-md mx-auto h-screen overflow-hidden pt-16 pb-20">
        <div className={`${gameBackground} h-full w-full absolute top-0 left-0 opacity-40`}></div>
        
        <div className="relative h-full flex flex-col p-4 z-10">
          {/* Game Title */}
          <div className="text-center mb-2">
            <div className="inline-block px-4 py-0.5 bg-[hsl(var(--gold-primary))]/20 rounded-lg">
              <span className="text-[hsl(var(--gold-primary))] text-xs font-medium">BẤM VÀO TRỨNG VÀNG</span>
            </div>
            <h1 className="text-white font-bold text-xl mt-1">ĐẬP VỠ TRỨNG VÀNG</h1>
          </div>
          
          {/* Countdown Timer */}
          <CountdownTimer deadline={deadline} />
          
          {/* Egg Grid */}
          <EggGrid 
            brokenEggs={brokenEggs} 
            onEggClick={handleEggClick} 
          />
          
          {/* Claim Button And Progress Bar */}
          <div className="mt-auto mb-2">
            {/* Claim button */}
            <motion.button 
              className="w-full bg-gradient-to-r from-[hsl(var(--gold-secondary))] to-[hsl(var(--gold-primary))] text-white font-bold py-2.5 rounded-lg shadow-md mb-3"
              whileTap={{ scale: 0.95 }}
              onClick={handleClaimClick}
            >
              Nhận ngay
            </motion.button>
            
            {/* Progress bar */}
            <div className="relative h-2 bg-gray-300 rounded-full mb-2 overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-[hsl(var(--gold-primary))] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
            
            {/* Progress percentage */}
            <div className="text-right text-xs text-white/80 mb-2">
              <span>{progress.toFixed(2)}%</span>
            </div>
          </div>
          
          {/* Leaderboard Section */}
          <LeaderboardSection leaderboard={leaderboard || []} isLoading={leaderboardLoading} />
        </div>
      </div>
      
      {/* Footer Navigation */}
      <FooterNavigation />
      
      {/* Reward Notification */}
      <RewardNotification 
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        reward={currentReward}
      />
    </div>
  );
};

export default Game;
