import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { GameSettings } from "@/utils/game/types";

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  timerPaused: boolean;
  settings: GameSettings;
}

const Timer = ({ timeLimit, onTimeUp, timerPaused, settings }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit); // Reset timer when timeLimit changes
  }, [timeLimit]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (!timerPaused && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      onTimeUp();
    }

    return () => clearInterval(intervalId);
  }, [timeLeft, timerPaused, onTimeUp]);

  const percentage = (timeLeft / timeLimit) * 100;

  return (
    <div>
      <Progress value={percentage} className="h-4" />
      <div className="text-center text-sm mt-1">Time Remaining: {timeLeft} seconds</div>
    </div>
  );
};

export default Timer;
