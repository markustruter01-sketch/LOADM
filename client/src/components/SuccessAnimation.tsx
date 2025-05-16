import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, PartyPopper } from "lucide-react";

type SuccessAnimationType = "login" | "register" | "submission";

interface SuccessAnimationProps {
  type: SuccessAnimationType;
  show: boolean;
  onComplete?: () => void;
}

export default function SuccessAnimation({ type, show, onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show) {
      // Hide animation after 2.5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  // Animation content based on type
  const getContent = () => {
    switch (type) {
      case "login":
        return {
          icon: <Check className="h-10 w-10 text-white" />,
          title: "Welcome back!",
          message: "Successfully logged in"
        };
      case "register":
        return {
          icon: <PartyPopper className="h-10 w-10 text-white" />,
          title: "Welcome aboard!",
          message: "Account created successfully"
        };
      case "submission":
        return {
          icon: <Check className="h-10 w-10 text-white" />,
          title: "Great job!",
          message: "Submission completed successfully"
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
          >
            <motion.div
              className="bg-primary rounded-full p-5 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 300,
                damping: 15
              }}
            >
              {content.icon}
            </motion.div>
            
            <motion.h2
              className="text-2xl font-bold text-white mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {content.title}
            </motion.h2>
            
            <motion.p
              className="text-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {content.message}
            </motion.p>
            
            {/* Confetti effect for register */}
            {type === "register" && (
              <>
                {Array.from({ length: 30 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="absolute"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0,
                      opacity: 1
                    }}
                    animate={{ 
                      x: Math.random() * 400 - 200, 
                      y: Math.random() * 400 - 200,
                      scale: Math.random() * 0.5 + 0.5,
                      opacity: 0
                    }}
                    transition={{ 
                      duration: 1 + Math.random(), 
                      delay: Math.random() * 0.3
                    }}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: index % 3 === 0 ? '#FF9500' : index % 3 === 1 ? '#FFD700' : '#FFFFFF',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}