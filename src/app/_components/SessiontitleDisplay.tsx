"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionTitleDisplay() {
  const { isWorking, isRunning, workDuration, timeLeft } = useTimerStore();

  const text = isRunning
    ? isWorking
      ? "Focus"
      : "Break"
    : workDuration === timeLeft
    ? "BeFocused"
    : isWorking
    ? "Paused"
    : "Break";

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={text} // Forces re-render when text changes
        animate={{ opacity: 1, y: 0 }} // Fades in and moves into place
        exit={{ opacity: 0, y: 0 }} // Moves up slightly when fading out
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="text-right text-4xl font-bold sm:text-7xl md:text-5xl lg:text-7xl"
      >
        {text}
      </motion.p>
    </AnimatePresence>
  );
}