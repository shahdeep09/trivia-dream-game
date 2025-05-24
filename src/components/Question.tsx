
import { useState, useEffect } from "react";
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
  const windowSize = useWindowSize();
  
  useEffect(() => {
    setSelectedIndex(selectedOption);
    // Reset suspense played state when question changes
    setSuspensePlayed(false);
  }, [selectedOption, question]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null || disabledOptions.includes(index) || revealAnswer) return;
    
    setSelectedIndex(index);
    onOptionSelect(); // Pause the timer
  };

  const confirmAnswer = () => {
    if (selectedIndex !== null) {
      onAnswer(selectedIndex);
    }
  };

  const getOptionClass = (index: number) => {
    let className = "relative flex items-center w-full my-2 py-3 px-6 rounded-2xl border-2 border-yellow-400 overflow-hidden ";
    
    if (disabledOptions.includes(index)) {
      className += " opacity-30";
    }
    
    if (selectedIndex === index) {
      className += " selected bg-millionaire-accent"; 
    }
    
    if (showResult && revealAnswer) {
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
    <ScrollArea className="h-[calc(100vh-220px)] w-full px-4">
      <div className="w-full max-w-4xl mx-auto pb-8">
        {/* Question hexagon container */}
        <div className="bg-millionaire-primary border-4 border-yellow-400 p-6 rounded-2xl mb-8 shadow-lg text-center relative hexagon-question">
          <h2 className="text-3xl md:text-4xl text-white font-bold px-4 py-6">
            {question.text}
          </h2>
        </div>

        {/* Options in grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="mt-8 mb-6">
          <Timer
            isActive={!revealAnswer}
            onTimeUp={onTimeUp}
            settings={settings}
            isPaused={timerPaused}
          />
        </div>

        {/* Lifelines positioned under the timer */}
        <div className="flex justify-center mb-6 gap-6">
          <Lifeline
            type="fifty-fifty"
            isUsed={lifelinesUsed["fifty-fifty"]}
            onUse={onUseLifeline}
            currentQuestion={question}
            settings={settings}
          />
          <Lifeline
            type="phone-friend"
            isUsed={lifelinesUsed["phone-friend"]}
            onUse={onUseLifeline}
            currentQuestion={question}
            settings={settings}
          />
          <Lifeline
            type="ask-audience"
            isUsed={lifelinesUsed["ask-audience"]}
            onUse={onUseLifeline}
            currentQuestion={question}
            settings={settings}
          />
        </div>

        {selectedIndex !== null && !revealAnswer && (
          <div className="mt-6 flex justify-center">
            <button
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary font-bold py-2 px-6 rounded-full animate-pulse"
              onClick={confirmAnswer}
            >
              Final Answer
            </button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default Question;
