import { useCallback, useEffect, useState } from "react";

export const useTimer = (
  sessions: number,
  workDuration: number,
  breakDuration: number,
) => {
  const [currentSession, setCurrentSession] = useState(1);
  const [isWorking, setIsWorking] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setCurrentSession(1);
    setIsWorking(true);
    setTimeLeft(workDuration);
    setIsRunning(false);
  }, [workDuration]);

  const skipToNextSession = () => {
    if (isWorking) {
      setIsWorking(false);
      setTimeLeft(breakDuration);
    } else {
      setIsWorking(true);
      setTimeLeft(workDuration);
      setCurrentSession((prev) => Math.min(prev + 1, sessions));
    }
    setIsRunning(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
  
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            if (isWorking && currentSession < sessions) {
              setIsWorking(false);
              return breakDuration;
            } else if (!isWorking) {
              setIsWorking(true);
              setCurrentSession((prev) => prev + 1);
              return workDuration;
            } else {
              setIsRunning(false);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isWorking, currentSession, sessions, workDuration, breakDuration]);


  return {
    currentSession,
    isWorking,
    timeLeft,
    isRunning,
    toggleTimer: () => setIsRunning((prev) => !prev),
    reset,
    skipToNextSession,
  };
};
