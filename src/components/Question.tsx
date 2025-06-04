import React, { useState, useEffect } from "react";
import { Question as QuestionType, GameSettings } from "@/utils/game/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/utils/game/questionUtils";
import Timer from "./Timer";
import { cn } from "@/lib/utils";

interface QuestionProps {
  question: QuestionType;
  onAnswer: (selectedIndex: number) => void;
  revealAnswer: boolean;
  disabledOptions: number[];
  settings: GameSettings;
  selectedOption: number | null;
  showResult: boolean;
  onOptionSelect: (optionIndex: number) => void;
  onTimeUp: () => void;
  timerPaused: boolean;
  lifelinesUsed: Record<string, boolean>;
  onUseLifeline: (lifelineId: string, result: any) => void;
  questionIndex: number;
  timeLimit: number;
  quizLogo?: string;
}

const Question = ({
  question,
  onAnswer,
  revealAnswer,
  disabledOptions,
  settings,
  selectedOption,
  showResult,
  onOptionSelect,
  onTimeUp,
  timerPaused,
  lifelinesUsed,
  onUseLifeline,
  questionIndex,
  timeLimit,
  quizLogo
}: QuestionProps) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  return (
    <div className="flex flex-col items-center justify-center">
      {quizLogo && (
        <img 
          src={quizLogo} 
          alt="Quiz Logo" 
          className="w-20 h-20 object-cover rounded mb-4"
        />
      )}
      
      <div className="text-2xl font-bold mb-4 text-center">
        {question.text}
      </div>
      
      <Timer
        timeLimit={timeLimit}
        onTimeUp={onTimeUp}
        timerPaused={timerPaused}
        setTimeRemaining={setTimeRemaining}
      />
      
      <Progress value={(timeLimit - timeRemaining) / timeLimit * 100} className="w-full max-w-md mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className={cn(
              "w-full text-lg py-3 rounded-md",
              selectedOption === index
                ? "border-2 border-millionaire-gold text-millionaire-gold"
                : "border-millionaire-accent text-millionaire-light",
              revealAnswer && index === question.correctOptionIndex
                ? "bg-green-600 text-white"
                : revealAnswer && selectedOption === index && index !== question.correctOptionIndex
                  ? "bg-red-600 text-white"
                  : "hover:bg-millionaire-accent",
              disabledOptions.includes(index) ? "opacity-50 cursor-not-allowed" : ""
            )}
            onClick={() => onOptionSelect(index)}
            disabled={revealAnswer || disabledOptions.includes(index) || timerPaused}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Question;
