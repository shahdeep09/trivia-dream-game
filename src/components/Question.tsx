
import { useState, useEffect } from "react";
import { Question as QuestionType, playSound, GameSettings } from "@/utils/gameUtils";
import Timer from "./Timer";
import Lifeline from "./Lifeline";
import { useWindowSize } from "@/hooks/use-window-size";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
    
    // Suspense sound logic removed as requested
  };

  const confirmAnswer = () => {
    if (selectedIndex !== null) {
      onAnswer(selectedIndex);
    }
  };

  const getOptionClass = (index: number) => {
    let className = "option-button";
    
    if (disabledOptions.includes(index)) {
      className += " opacity-30";
    }
    
    if (selectedIndex === index) {
      className += " selected bg-yellow-500"; // Yellow background for selected option
    }
    
    if (showResult && revealAnswer) {
      if (index === question.correctOptionIndex) {
        className += " correct";
      } else if (selectedIndex === index) {
        className += " wrong";
      }
    }
    
    return className;
  };

  const optionLabels = ["A", "B", "C", "D"];

  // Calculate if content needs scrolling based on window size
  const needsScrolling = windowSize.height ? windowSize.height < 700 : false;

  return (
    <div className={`w-full max-w-2xl mx-auto ${needsScrolling ? 'overflow-y-auto max-h-[80vh]' : ''}`}>
      {/* Crorepati Logo */}
      <div className="flex justify-center mb-6">
        <img 
          src="/lovable-uploads/53c30491-2339-4371-b7b0-b77acda033a4.png" 
          alt="Kaun Banega Crorepati Logo" 
          className="w-40 h-40 object-contain"
        />
      </div>

      <div className="bg-millionaire-primary p-6 rounded-lg border border-millionaire-highlight mb-6 shadow-lg animate-fade-in hexagon">
        <h2 className="text-3xl md:text-4xl text-center text-millionaire-light font-medium mb-2">
          {question.text}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(index)}
            disabled={disabledOptions.includes(index) || revealAnswer}
            onClick={() => handleOptionClick(index)}
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-millionaire-accent mr-3">
              {optionLabels[index]}
            </span>
            <span className="flex-1 text-left text-xl">{option}</span>
          </button>
        ))}
      </div>

      {/* Timer positioned below questions */}
      <div className="mb-6 flex justify-center">
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
  );
};

export default Question;
