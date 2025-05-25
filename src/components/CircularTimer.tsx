
import { useEffect, useState } from "react";
import { GameSettings, getQuestionConfig } from "@/utils/gameUtils";

interface CircularTimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  settings: GameSettings;
  isPaused?: boolean;
  questionIndex: number;
}

const CircularTimer = ({ isActive, onTimeUp, settings, isPaused = false, questionIndex }: CircularTimerProps) => {
  const config = getQuestionConfig(questionIndex);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);

  useEffect(() => {
    // Reset timer when question changes
    if (isActive) {
      const newConfig = getQuestionConfig(questionIndex);
      setTimeLeft(newConfig.timeLimit);
    }
  }, [isActive, questionIndex]);

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

  const totalTime = getQuestionConfig(questionIndex).timeLimit;
  const progress = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-millionaire-primary opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`text-millionaire-gold transition-all duration-1000 ease-linear ${
              timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-yellow-500' : 'text-millionaire-gold'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${
            timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-yellow-500' : 'text-millionaire-gold'
          }`}>
            {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
          </span>
        </div>
      </div>
      
      {isPaused && (
        <div className="mt-2 text-millionaire-gold font-semibold text-sm">
          Timer Paused
        </div>
      )}
    </div>
  );
};

export default CircularTimer;
