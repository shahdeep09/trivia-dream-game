
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { QuizConfig } from "@/types/quiz";
import { UserMenu } from "@/components/auth/UserMenu";

interface HomeHeaderProps {
  currentQuizConfig: QuizConfig;
  forceRefresh: () => void;
}

const HomeHeader = ({ currentQuizConfig, forceRefresh }: HomeHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center space-x-4">
        {currentQuizConfig.logo && (
          <img 
            src={currentQuizConfig.logo} 
            alt="Quiz Logo" 
            className="w-16 h-16 object-cover rounded-full border-2 border-millionaire-gold"
          />
        )}
        <div>
          <h1 className="text-4xl font-bold text-millionaire-gold">{currentQuizConfig.samajName}</h1>
          <p className="text-millionaire-light mt-2">
            Quiz Competition - {currentQuizConfig.numberOfQuestions} Questions - Quiz ID: {currentQuizConfig.id?.slice(0, 8)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          onClick={forceRefresh}
          variant="outline"
          size="sm"
          className="border-millionaire-accent hover:bg-millionaire-accent text-white h-9"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh Data
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-millionaire-accent hover:bg-millionaire-accent text-white h-9"
        >
          <Link to="/manager">
            <Settings size={16} className="mr-2" />
            Quiz Manager
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary font-semibold h-9"
        >
          <Link to="/game">
            <Play size={16} className="mr-2" />
            Play Game
          </Link>
        </Button>
        <UserMenu />
      </div>
    </div>
  );
};

export default HomeHeader;
