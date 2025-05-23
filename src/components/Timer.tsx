
import { useEffect, useState } from "react";
import { GameSettings } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface TimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  settings: GameSettings;
  isPaused?: boolean;
}

const Timer = ({ isActive, onTimeUp, settings, isPaused = false }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(settings.timePerQuestion);

  useEffect(() => {
    // Reset timer when question changes
    if (isActive) {
      setTimeLeft(settings.timePerQuestion);
    }
  }, [isActive, settings.timePerQuestion]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            onTimeUp();
          }
          return newTime;
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
