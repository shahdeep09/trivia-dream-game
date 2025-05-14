
import { useEffect, useState } from "react";
import { GameSettings } from "@/utils/gameUtils";

interface TimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  settings: GameSettings;
  isPaused?: boolean;
}

const Timer = ({ isActive, onTimeUp, settings, isPaused = false }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(settings.timePerQuestion);
  const [animationDuration, setAnimationDuration] = useState(`${settings.timePerQuestion}s`);

  useEffect(() => {
    // Reset timer when question changes
    if (isActive) {
      setTimeLeft(settings.timePerQuestion);
      setAnimationDuration(`${settings.timePerQuestion}s`);
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

  // Calculate timer color based on time left
  const getTimerColor = () => {
    const percentage = timeLeft / settings.timePerQuestion;
    if (percentage > 0.6) return "bg-green-500";
    if (percentage > 0.3) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-millionaire-light">Time left</span>
        <span className="text-sm font-medium text-millionaire-light">
          {timeLeft} seconds
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className={`${getTimerColor()} h-2.5 rounded-full`}
          style={{
            width: isActive && !isPaused ? `${(timeLeft / settings.timePerQuestion) * 100}%` : '100%',
            transition: 'width 1s linear'
          }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
