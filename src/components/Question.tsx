
import { useState, useEffect } from "react";
import { Question as QuestionType, playSound, GameSettings } from "@/utils/gameUtils";
import Timer from "./Timer";
import Lifeline from "./Lifeline";

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

  useEffect(() => {
    setSelectedIndex(selectedOption);
    // Reset suspense played state when question changes
    setSuspensePlayed(false);
  }, [selectedOption, question]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null || disabledOptions.includes(index) || revealAnswer) return;
    
    setSelectedIndex(index);
    onOptionSelect(); // Pause the timer
    
    // Play suspense sound but don't submit answer yet
    if (!suspensePlayed) {
      playSound("suspense", settings);
      setSuspensePlayed(true);
    }
  };

  const confirmAnswer = () => {
    if (selectedIndex !== null) {
      playSound("final-answer", settings);
      onAnswer(selectedIndex);
    }
  };

  const getOptionClass = (index: number) => {
    let className = "option-button";
    
    if (disabledOptions.includes(index)) {
      className += " opacity-30";
    }
    
    if (selectedIndex === index) {
      className += " selected";
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-millionaire-primary p-6 rounded-lg border border-millionaire-highlight mb-6 shadow-lg animate-fade-in hexagon">
        <h2 className="text-xl md:text-2xl text-center text-millionaire-light font-medium mb-2">
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
            <span className="flex-1 text-left">{option}</span>
          </button>
        ))}
      </div>

      {/* Timer positioned below questions */}
      <div className="mb-6">
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
