import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameState, RevealAllEggsResult } from "@shared/schema";
import CountdownTimer from "@/components/CountdownTimer";
import EggGrid from "@/components/EggGrid";
import RewardNotification from "@/components/RewardNotification";

const Game = () => {
  // Game state
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [brokenEggs, setBrokenEggs] = useState<number[]>([]);
  const [eggRewards, setEggRewards] = useState<{[key: number]: number | string}>({});
  const [allEggsRevealed, setAllEggsRevealed] = useState(false);
  
  // Lấy linkId từ query params nếu có
  const urlSearchParams = new URLSearchParams(window.location.search);
  const linkId = parseInt(urlSearchParams.get('linkId') || '0', 10);

  // Fetch game state from server with linkId
  const { data: gameData, isLoading: gameLoading } = useQuery<GameState>({
    queryKey: ["/api/game-state", linkId],
    queryFn: async () => {
      const response = await fetch(`/api/game-state${linkId ? `?linkId=${linkId}` : ''}`);
      return response.json();
    }
  });

  // Break egg mutation
  const { mutate: breakEgg } = useMutation({
    mutationFn: async (eggId: number) => {
      // Gửi kèm linkId nếu có
      const response = await apiRequest("POST", "/api/break-egg", { 
        eggId, 
        linkId: linkId || undefined 
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("🎯 Break egg API response:", data);

      if (data.eggs) {
        // Case: Trả về là RevealAllEggsResult - khi đập trứng với link
        const revealData = data as RevealAllEggsResult;
        console.log("🎯 Processing RevealAllEggsResult:", revealData);

        // Lưu thông tin trứng được đập
        setBrokenEggs([revealData.brokenEggId]);
        console.log("🥚 Setting brokenEggs:", [revealData.brokenEggId]);

        // Lưu phần thưởng của tất cả các quả trứng
        const rewardsMap: {[key: number]: number | string} = {};
        revealData.eggs.forEach(egg => {
          rewardsMap[egg.id] = egg.reward;
        });
        console.log("🎁 Setting eggRewards:", rewardsMap);
        setEggRewards(rewardsMap);

        // Đánh dấu tất cả trứng đã được tiết lộ
        console.log("🔓 Setting allEggsRevealed to true");
        setAllEggsRevealed(true);

        // Hiển thị phần thưởng cho quả trứng được đập
        console.log("💰 Setting currentReward:", revealData.reward);
        setCurrentReward(revealData.reward);
        setShowReward(true);
      } else {
        // Case: Trả về là BreakEggResult - khi đập trứng thông thường
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
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state", linkId] });
    },
  });

  // Claim rewards mutation (không cần trong chế độ link)
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
      setAllEggsRevealed(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state", linkId] });
    },
  });

  // Handle egg click
  const handleEggClick = (eggId: number) => {
    // Nếu đã đập một quả trứng trong chế độ link, không cho phép đập thêm
    if (allEggsRevealed && linkId) {
      alert("Bạn chỉ được đập một quả trứng duy nhất. Vui lòng sử dụng link khác để đập trứng khác.");
      return;
    }
    
    // Kiểm tra xem có đang sử dụng link
    if (linkId) {
      // Kiểm tra xem link đã được sử dụng chưa
      if (gameData?.linkUsed) {
        alert("Link này đã được sử dụng. Vui lòng sử dụng link khác.");
        return;
      }
      
      // Cho phép đập bất kỳ quả trứng nào khi sử dụng link
      // Không cần kiểm tra quả trứng được phép đập nữa
      breakEgg(eggId);
    } else {
      // Chế độ thông thường
      if (!brokenEggs.includes(eggId)) {
        breakEgg(eggId);
      }
    }
  };

  // Handle claim button click - Break random egg or claim rewards
  const handleClaimClick = () => {
    if (linkId) {
      // Trong chế độ link, nút này chỉ dùng để refresh
      window.location.reload();
      return;
    }
    
    // Get available (non-broken) eggs
    const availableEggs = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(id => !brokenEggs.includes(id));
    
    // If all eggs are broken, claim rewards instead
    if (availableEggs.length === 0) {
      claimRewards();
      return;
    }
    
    // Choose a random egg from available eggs
    const randomIndex = Math.floor(Math.random() * availableEggs.length);
    const randomEggId = availableEggs[randomIndex];
    
    // Break the selected egg
    breakEgg(randomEggId);
  };

  // Calculate time remaining
  const deadline = gameData?.deadline || Date.now() + 24 * 60 * 60 * 1000; // Default 24h from now
  
  // Update UI when game state changes
  useEffect(() => {
    if (gameData) {
      setBrokenEggs(gameData.brokenEggs || []);
      setProgress(gameData.progress || 0);

      // Xử lý trạng thái link đã sử dụng
      if (gameData.linkId && gameData.linkUsed) {
        setAllEggsRevealed(true);

        // Nếu link đã được sử dụng, lấy thông tin tất cả các quả trứng
        if (gameData.eggs && gameData.eggs.length > 0) {
          const rewards: {[key: number]: number | string} = {};
          gameData.eggs.forEach(egg => {
            rewards[egg.id] = egg.reward;
          });
          setEggRewards(rewards);
        }
      }
    }
  }, [gameData, linkId]);
  
  // Game background
  const gameBackground = "bg-gradient-to-b from-blue-900 to-blue-950";

  return (
    <div className="relative min-h-screen bg-[hsl(var(--blue-dark))] overflow-y-auto"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 215, 0, 0.5) rgba(0, 0, 128, 0.2)'
      }}>
        <div className={`${gameBackground} fixed inset-0 opacity-40`}></div>
        
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col p-4 z-10">
          {/* Game Title */}
          <div className="text-center mb-2 mt-4">
            
            <h1 className="text-white font-bold text-xl mt-1">ĐẬP VỠ TRỨNG VÀNG</h1>
          </div>
        
        {/* Link Info - hiển thị khi sử dụng link */}
        {linkId > 0 && (
          <div className="mb-3 p-2 bg-[hsl(var(--red-primary))]/20 rounded-lg text-center">
            <span className="text-white text-sm">
              {gameData?.linkUsed || allEggsRevealed
                ? "Link này đã được sử dụng. Chỉ có thể xem phần thưởng." 
                : `Bạn chỉ được đập 1 quả trứng duy nhất.`}
            </span>
          </div>
        )}
          
          {/* Countdown Timer */}
          <CountdownTimer deadline={deadline} />
          
          {/* Egg Grid */}
          <EggGrid 
            brokenEggs={brokenEggs} 
            onEggClick={handleEggClick} 
          eggRewards={eggRewards}
          allEggsRevealed={allEggsRevealed}
          allowedEggId={undefined} // Không cần đánh dấu quả trứng nào được phép đập nữa
          />
          
        {/* Claim/Reset Button And Progress Bar */}
          <div className="mt-auto mb-2">
          {/* Claim button - đổi thành "Thử lại" khi sử dụng link */}
            <motion.button 
              className="w-full bg-gradient-to-r from-[hsl(var(--gold-secondary))] to-[hsl(var(--gold-primary))] text-white font-bold py-2.5 rounded-lg shadow-md mb-3"
              whileTap={{ scale: 0.95 }}
              onClick={handleClaimClick}
            >
            {linkId ? "Thử lại" : "Nhận ngay"}
            </motion.button>
            
          {/* Progress bar - chỉ hiển thị khi không sử dụng link */}
          {!linkId && (
            <>
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
            </>
          )}
          </div>
      </div>
      
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
