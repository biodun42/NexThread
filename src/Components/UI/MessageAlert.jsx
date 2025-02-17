import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const MessageAlert = ({
  message,
  isVisible,
  onClose,
  type = "error",
  position = "top",
  duration = 3000, // Duration in milliseconds
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let timer;
    let progressTimer;

    if (isVisible) {
      // Reset progress when message becomes visible
      setProgress(100);

      // Smoothly decrease progress
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 * (1 - elapsed / duration));
        setProgress(remaining);

        if (remaining > 0) {
          progressTimer = requestAnimationFrame(updateProgress);
        }
      };
      progressTimer = requestAnimationFrame(updateProgress);

      // Close alert after duration
      timer = setTimeout(onClose, duration);
    }

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(progressTimer);
    };
  }, [isVisible, duration, onClose]);

  const variants = {
    initial: {
      opacity: 0,
      y: position === "top" ? -50 : 50,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: position === "top" ? -50 : 50,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed ${
            position === "top" ? "top-4" : "bottom-4"
          } left-1/2 transform -translate-x-1/2 z-50`}
        >
          <div
            className={`relative flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm ${
              type === "error"
                ? "bg-red-500/90 shadow-red-500/20"
                : "bg-emerald-500/90 shadow-emerald-500/20"
            }`}
          >
            {type === "error" ? (
              <AlertCircle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-white" />
            )}
            <span className="text-white font-medium">{message}</span>
            <button
              onClick={onClose}
              className="ml-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                className={`h-full ${
                  type === "error" ? "bg-red-400" : "bg-emerald-400"
                }`}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageAlert;
