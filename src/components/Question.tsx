
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
  timeLimit = 30,
  quizLogo
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
    let baseClass = "relative w-full px-8 py-4 text-left text-white font-medium text-lg transition-all duration-300 ";
    
    if (disabledOptions.includes(index)) {
      return baseClass + "opacity-50 cursor-not-allowed bg-gray-600 border-2 border-yellow-400";
    }
    
    if (selectedOption === index) {
      baseClass += "bg-orange-500 border-2 border-yellow-400 shadow-lg ";
    } else {
      baseClass += "bg-blue-800 hover:bg-blue-700 border-2 border-yellow-400 ";
    }
    
    if (revealAnswer && showResult) {
      if (index === question.correctOptionIndex) {
        baseClass += "bg-green-600 border-2 border-green-400";
      } else if (selectedOption === index && index !== question.correctOptionIndex) {
        baseClass += "bg-red-600 border-2 border-red-400";
      }
    }
    
    return baseClass;
  };

  const letterMapping = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Main content container */}
      <div className="relative min-h-[600px] p-8">
        
        {/* Logo at the top */}
        {quizLogo && (
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src={quizLogo} 
                alt="Quiz Logo" 
                className="w-32 h-32 object-cover rounded-full border-4 border-yellow-400 shadow-lg"
              />
            </div>
          </div>
        )}
        
        {/* Question */}
        <div className="mb-12">
          <div className="p-6 rounded-lg border-2 border-yellow-400 shadow-lg bg-transparent">
            <h2 className="text-2xl font-bold text-center text-white leading-relaxed">
              {question.text}
            </h2>
          </div>
        </div>
        
        {/* Options in classic millionaire hexagonal style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {question.options.map((option, index) => (
            <div key={index} className="relative">
              {/* Hexagonal option button */}
              <button
                onClick={() => !revealAnswer && !disabledOptions.includes(index) && onOptionSelect(index)}
                disabled={revealAnswer || disabledOptions.includes(index)}
                className={`${getOptionClass(index)} 
                  clipPath-hexagon min-h-[60px] flex items-center justify-start
                  shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`}
                style={{
                  clipPath: 'polygon(20px 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0% 50%)'
                }}
              >
                <div className="flex items-center w-full">
                  <span className="font-bold text-yellow-300 text-xl mr-4 min-w-[30px]">
                    {letterMapping[index]}:
                  </span>
                  <span className="flex-1 text-left">{option}</span>
                </div>
              </button>
            </div>
          ))}
        </div>
        
        {/* Timer at the bottom */}
        <div className="flex justify-center">
          <CircularTimer
            timeLeft={timeLeft}
            totalTime={timeLimit}
            isPaused={timerPaused}
          />
        </div>
      </div>
    </div>
  );
};

export default Question;
