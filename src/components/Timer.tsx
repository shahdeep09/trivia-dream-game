
import { useEffect, useState, useRef } from "react";
import { GameSettings } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface TimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  settings: GameSettings;
  isPaused?: boolean;
  timeLimit?: number;
}

const Timer = ({ isActive, onTimeUp, settings, isPaused = false, timeLimit }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit || settings.timePerQuestion);
  const hasCalledTimeUp = useRef(false);

  useEffect(() => {
    // Reset timer when question changes
    if (isActive) {
      setTimeLeft(timeLimit || settings.timePerQuestion);
      hasCalledTimeUp.current = false;
    }
  }, [isActive, settings.timePerQuestion, timeLimit]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0 && !hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            clearInterval(interval);
            onTimeUp();
          }
          return Math.max(0, newTime);
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft, onTimeUp]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full border-4 border-millionaire-accent bg-millionaire-primary flex items-center justify-center">
        <span className="text-2xl font-bold text-millionaire-gold">
          {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
        </span>
      </div>
      {isPaused && (
        <div className="mt-2 text-millionaire-gold font-semibold">
          Timer Paused
        </div>
      )}
    </div>
  );
};

export default Timer;
