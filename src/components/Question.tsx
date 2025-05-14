
import { useState, useEffect } from "react";
import { Question as QuestionType, playSound } from "@/utils/gameUtils";

interface QuestionProps {
  question: QuestionType;
  onAnswer: (selectedIndex: number) => void;
  revealAnswer: boolean;
  disabledOptions: number[];
  settings: any;
  selectedOption: number | null;
  showResult: boolean;
}

const Question = ({
  question,
  onAnswer,
  revealAnswer,
  disabledOptions,
  settings,
  selectedOption,
  showResult,
}: QuestionProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(selectedOption);
  }, [selectedOption]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null || disabledOptions.includes(index) || revealAnswer) return;
    
    setSelectedIndex(index);
    // Play suspense sound but don't submit answer yet
    playSound("suspense", settings);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
