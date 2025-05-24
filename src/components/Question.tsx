import { useState, useEffect, useCallback } from "react";
import { Question as QuestionType, playSound, GameSettings } from "@/utils/gameUtils";
import Timer from "./Timer";
import Lifeline from "./Lifeline";
import { useWindowSize } from "@/hooks/use-window-size";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

interface QuestionProps {
  question: QuestionType;
  onAnswer: (selectedIndex: number) => void;
  revealAnswer: boolean;
  disabledOptions: number[];
  settings: GameSettings;
  selectedOption: number | null;
  showResult: boolean;
  onOptionSelect: () => void;
  onTimeUp: () => void;
  timerPaused: boolean;
  lifelinesUsed: {
    "fifty-fifty": boolean;
    "phone-friend": boolean;
    "ask-audience": boolean;
  };
  onUseLifeline: (type: "fifty-fifty" | "phone-friend" | "ask-audience", result: any) => void;
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
}: QuestionProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [suspensePlayed, setSuspensePlayed] = useState(false);
  const [spacebarTip, setSpacebarTip] = useState(false);
  const windowSize = useWindowSize();
  
  useEffect(() => {
    setSelectedIndex(selectedOption);
    // Reset suspense played state when question changes
    setSuspensePlayed(false);
  }, [selectedOption, question]);

  // Handle spacebar shortcut for confirming answer
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && selectedIndex !== null && !revealAnswer) {
      event.preventDefault(); // Prevent page scrolling
      onAnswer(selectedIndex);
      setSpacebarTip(false);
    }
  }, [selectedIndex, onAnswer, revealAnswer]);

  useEffect(() => {
    // Add event listener for spacebar
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    // Show the spacebar tip when an option is selected
    if (selectedIndex !== null && !revealAnswer) {
      setSpacebarTip(true);
    } else {
      setSpacebarTip(false);
    }
  }, [selectedIndex, revealAnswer]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null || disabledOptions.includes(index) || revealAnswer) return;
    
    setSelectedIndex(index);
    onOptionSelect(); // Pause the timer
  };

  const getOptionClass = (index: number) => {
    let className = "relative flex items-center w-full my-2 py-3 px-6 rounded-2xl border-2 border-yellow-400 overflow-hidden ";
    
    if (disabledOptions.includes(index)) {
      className += " opacity-30";
    }
    
    // Make selected options yellow (before answer reveal)
    if (selectedIndex === index && !showResult) {
      className += " selected bg-yellow-500 text-millionaire-primary"; 
    }
    // Keep the previous styling for revealed answers
    else if (showResult && revealAnswer) {
      if (index === question.correctOptionIndex) {
        className += " correct bg-millionaire-correct border-millionaire-correct";
      } else if (selectedIndex === index) {
        className += " wrong bg-millionaire-wrong border-millionaire-wrong";
      }
    }
    
    className += " hexagon-option"; // Add hexagon shape class
    
    return className;
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col h-full">
      {/* KBC Logo at the top */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 relative">
          <img 
            src="/placeholder.svg" 
            alt="KBC Logo" 
            className="w-full h-full object-contain kbc-logo"
          />
        </div>
      </div>

      {/* Question Container */}
      <div className="w-full max-w-4xl mx-auto">
        {/* Question hexagon container */}
        <div className="bg-millionaire-primary border-4 border-yellow-400 p-6 rounded-2xl mb-6 shadow-lg text-center relative hexagon-question">
          <h2 className="text-3xl md:text-4xl text-white font-bold px-4 py-4">
            {question.text}
          </h2>
        </div>

        {/* Options in grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              disabled={disabledOptions.includes(index) || revealAnswer}
              onClick={() => handleOptionClick(index)}
            >
              <div className="flex items-center w-full">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-millionaire-primary font-bold mr-3">
                  {optionLabels[index]}
                </span>
                <span className="flex-1 text-left text-xl text-white">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Timer positioned below questions */}
        <div className="mt-6 mb-4">
          <Timer
            isActive={!revealAnswer}
            onTimeUp={onTimeUp}
            settings={settings}
            isPaused={timerPaused}
          />
        </div>

        {/* Spacebar tip message */}
        {spacebarTip && (
          <div className="mt-4 text-center animate-pulse">
            <p className="text-millionaire-gold font-bold">Press SPACEBAR to confirm your final answer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Question;
