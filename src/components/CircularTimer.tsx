
import { useEffect, useState, useRef } from "react";

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  isPaused: boolean;
  onTimeUp?: () => void;
  isActive?: boolean;
}

const CircularTimer = ({ timeLeft, totalTime, isPaused, onTimeUp, isActive = true }: CircularTimerProps) => {
  const progress = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const hasCalledTimeUp = useRef(false);

  // Reset the ref when timer is restarted (timeLeft increases or isActive changes)
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      hasCalledTimeUp.current = false;
    }
  }, [isActive, timeLeft > 0]);

  // Handle time up event with protection against multiple calls
  useEffect(() => {
    if (isActive && timeLeft <= 0 && !hasCalledTimeUp.current && onTimeUp) {
      hasCalledTimeUp.current = true;
      console.log('CircularTimer: Calling onTimeUp()');
      onTimeUp();
    }
  }, [timeLeft, isActive, onTimeUp]);

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
