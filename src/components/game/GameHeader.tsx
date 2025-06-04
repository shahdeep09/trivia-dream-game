
import React from "react";
import { QuizConfig } from "@/types/quiz";

interface GameHeaderProps {
  quizConfig: QuizConfig;
}

const GameHeader = ({ quizConfig }: GameHeaderProps) => {
  return (
    <div className="bg-millionaire-primary border-b border-millionaire-accent p-4">
      <div className="flex items-center justify-center">
        {quizConfig.logo && (
          <img 
            src={quizConfig.logo} 
            alt="Quiz Logo" 
            className="w-12 h-12 object-cover rounded mr-4"
          />
        )}
        <h1 className="text-3xl font-bold text-millionaire-gold">{quizConfig.samajName}</h1>
      </div>
    </div>
  );
};

export default GameHeader;
