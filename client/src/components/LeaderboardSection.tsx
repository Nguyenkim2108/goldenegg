import { motion } from "framer-motion";
import { User } from "@shared/schema";

interface LeaderboardSectionProps {
  leaderboard: User[];
  isLoading: boolean;
}

const LeaderboardSection = ({ leaderboard, isLoading }: LeaderboardSectionProps) => {
  // Placeholder data for loading state
  const placeholderData = Array(3).fill(null).map((_, i) => ({
    id: i + 1,
    username: `${i + 1}st********`,
    score: 0,
  }));

  // Get top 3 users from leaderboard or use placeholder data
  const topUsers = isLoading ? placeholderData : leaderboard.slice(0, 3);

  // Format score to K format
  const formatScore = (score: number) => {
    return `${(score / 1000).toFixed(2)} K`;
  };

  return (
    <motion.div 
      className="bg-[hsl(var(--blue-dark))]/80 rounded-lg p-3 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center">
        {/* Coin icon */}
        <div className="w-8 h-8 mr-2">
          <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="25" cy="25" r="20" fill="url(#coinGradient)" />
            <circle cx="25" cy="25" r="16" fill="url(#coinGradient2)" stroke="#AF8100" strokeWidth="0.5" />
            <text x="25" y="30" fontSize="14" fontWeight="bold" fill="#7B5800" textAnchor="middle">K</text>
            
            {/* Coin shine */}
            <circle cx="18" cy="18" r="4" fill="rgba(255, 255, 255, 0.4)" />
            
            {/* Gradients */}
            <defs>
              <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="50%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FF8F00" />
              </linearGradient>
              <linearGradient id="coinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FFB300" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Leaderboard list */}
        <div className="flex-1">
          {topUsers.map((user, index) => (
            <div 
              key={user.id} 
              className={`flex items-center justify-between py-1 ${
                index < topUsers.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <div className="text-white/90 text-sm font-medium truncate">
                {isLoading ? user.username : `${index + 1}${getOrdinalSuffix(index + 1)}********`}
              </div>
              <div className="text-[hsl(var(--gold-primary))] font-bold text-sm">
                {isLoading ? "---" : formatScore(user.score || 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get ordinal suffix
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

export default LeaderboardSection;
