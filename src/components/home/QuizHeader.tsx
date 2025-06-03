
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { QuizConfig } from "@/types/quiz";

interface QuizHeaderProps {
  currentQuizConfig: QuizConfig;
  forceRefresh: () => void;
}

const QuizHeader = ({ currentQuizConfig, forceRefresh }: QuizHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-millionaire-gold">{currentQuizConfig.samajName}</h1>
        <p className="text-millionaire-light mt-2">
          Quiz Competition - {currentQuizConfig.numberOfQuestions} Questions - Quiz ID: {currentQuizConfig.id?.slice(0, 8)}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {currentQuizConfig.logo && (
          <img 
            src={currentQuizConfig.logo} 
            alt="Quiz Logo" 
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div className="flex space-x-2">
          <Button
            onClick={forceRefresh}
            variant="outline"
            className="border-millionaire-accent"
          >
            Refresh Data
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-millionaire-accent"
          >
            <Link to="/manager">
              <Settings size={16} className="mr-2" />
              Quiz Manager
            </Link>
          </Button>
          <Button
            asChild
            className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
          >
            <Link to="/game">Play Game</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizHeader;
