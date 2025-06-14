import { QuizConfig } from "@/types/quiz";

interface MoneyLadderProps {
  currentLevel: number;
  quizConfig: QuizConfig;
}

const MoneyLadder = ({ currentLevel, quizConfig }: MoneyLadderProps) => {
  // Create levels based on quiz configuration
  const levels = quizConfig.questionConfig.map((config, index) => ({
    level: index + 1,
    points: config.points,
    timeLimit: config.timeLimit
  }));
  
  // Reverse to display in descending order
  const reversedLevels = [...levels].reverse();
  
  // Get the class name for a level
  const getLevelClass = (index: number) => {
    const levelIndex = levels.length - 1 - index; // Convert back to original index
    let className = "p-1 text-center rounded-md flex justify-between items-center text-xl";
    
    if (levelIndex === currentLevel) {
      className += " bg-millionaire-accent text-millionaire-primary font-bold";
    } else if (levelIndex < currentLevel) {
      className += " bg-millionaire-secondary text-millionaire-gold";
    } else {
      className += " bg-millionaire-primary text-millionaire-light";
    }
    
    // Add special styling for milestone levels (every 5th level)
    if (levelIndex === 4 || levelIndex === 9 || levelIndex === 14) {
      className += " border-2 border-millionaire-gold";
    }
    
    return className;
  };
  
  return (
    <div className="bg-millionaire-secondary p-2 rounded-lg shadow-lg h-full">
      <h2 className="text-2xl font-bold text-center mb-2 text-millionaire-gold">Points Ladder</h2>
      <div className="space-y-0.5">
        {reversedLevels.map((level, index) => (
          <div key={index} className={getLevelClass(index)}>
            <span className="w-4 text-center">{level.level}</span>
            <span className="flex-1 text-center">
              {level.points} pts
            </span>
            <span className="w-8 text-center text-xl opacity-75">
              {level.timeLimit}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoneyLadder;
