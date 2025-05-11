import { motion, AnimatePresence } from "framer-motion";

interface RewardNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  reward: number;
}

const RewardNotification = ({ isOpen, onClose, reward }: RewardNotificationProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-30 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="notification-popup bg-[hsl(var(--cream-light))] rounded-lg px-6 py-4 max-w-xs w-full text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex flex-col items-center">
              {/* Confetti icons */}
              <div className="flex justify-between w-full absolute -top-3">
                <span className="text-xl">🎉</span>
                <span className="text-xl">🎊</span>
              </div>
              
              {/* Congratulation message */}
              <h3 className="text-[hsl(var(--red-primary))] font-bold text-lg mb-2">Wooo, chúc mừng bạn</h3>
              
              {/* Reward amount */}
              <div className="bg-[hsl(var(--gold-primary))]/20 px-4 py-2 rounded-lg mb-4">
                <p className="text-[hsl(var(--gold-secondary))] font-bold">
                  Trúng Thưởng <span className="text-[hsl(var(--red-primary))]">{reward.toFixed(2)}</span>
                </p>
              </div>
              
              {/* Broken egg image */}
              <div className="mb-4">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                  {/* Broken egg shell - top part */}
                  <path d="M35,30 C35,10 65,10 65,30 L60,45 L40,45 Z" fill="url(#goldGradient)" />
                  
                  {/* Broken egg shell - bottom part (cracked) */}
                  <path d="M30,55 C30,80 70,80 70,55 L65,50 L58,60 L50,48 L42,60 L35,50 Z" fill="url(#goldGradient)" />
                  
                  {/* Yolk */}
                  <circle cx="50" cy="62" r="12" fill="#FFC107" />
                  
                  {/* Shine on yolk */}
                  <circle cx="45" cy="58" r="3" fill="#FFECB3" />
                  
                  {/* Gold coins/rewards spilling out */}
                  <circle cx="42" cy="45" r="4" fill="#FFD700" />
                  <circle cx="58" cy="45" r="4" fill="#FFD700" />
                  <circle cx="50" cy="40" r="4" fill="#FFD700" />
                  
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
              </div>
              
              {/* Continue button */}
              <motion.button 
                className="w-full bg-gradient-to-r from-[hsl(var(--gold-secondary))] to-[hsl(var(--gold-primary))] text-white font-bold py-2 rounded-lg shadow-md"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
              >
                Tiếp tục
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardNotification;
