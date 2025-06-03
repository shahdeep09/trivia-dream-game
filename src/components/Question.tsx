
import { useState, useEffect } from "react";
import { Question as QuestionType, GameSettings } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import CircularTimer from "./CircularTimer";

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
  lifelinesUsed: any;
  onUseLifeline: any;
  questionIndex: number;
  timeLimit?: number;
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
  timeLimit = 30
}: QuestionProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [question, timeLimit]);

  useEffect(() => {
    if (timerPaused || revealAnswer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerPaused, revealAnswer, onTimeUp]);

  const getOptionClass = (index: number) => {
    let baseClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-300 text-white ";
    
    if (disabledOptions.includes(index)) {
      return baseClass + "bg-gray-600 border-gray-500 opacity-50 cursor-not-allowed";
    }
    
    if (selectedOption === index) {
      baseClass += "bg-millionaire-gold text-millionaire-primary border-millionaire-gold ";
    } else {
      baseClass += "bg-millionaire-secondary border-millionaire-accent hover:bg-millionaire-accent ";
    }
    
    if (revealAnswer && showResult) {
      if (index === question.correctOptionIndex) {
        baseClass += "bg-green-600 border-green-400 text-white animate-pulse";
      } else if (selectedOption === index && index !== question.correctOptionIndex) {
        baseClass += "bg-red-600 border-red-400 text-white";
      }
    }
    
    return baseClass;
  };

  const letterMapping = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Timer */}
      <div className="flex justify-center">
        <CircularTimer
          timeLeft={timeLeft}
          totalTime={timeLimit}
          isPaused={timerPaused}
        />
      </div>
      
      {/* Question */}
      <div className="bg-millionaire-secondary p-8 rounded-lg border border-millionaire-accent">
        <h2 className="text-2xl font-bold text-center text-millionaire-gold mb-8">
          {question.text}
        </h2>
        
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => !revealAnswer && !disabledOptions.includes(index) && onOptionSelect(index)}
              disabled={revealAnswer || disabledOptions.includes(index)}
              className={getOptionClass(index)}
            >
              <span className="font-bold mr-3">{letterMapping[index]}:</span>
              {option}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Question;
