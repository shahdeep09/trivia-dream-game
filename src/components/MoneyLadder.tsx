
import { getQuestionConfig } from "@/utils/gameUtils";

interface MoneyLadderProps {
  currentLevel: number;
}

const MoneyLadder = ({ currentLevel }: MoneyLadderProps) => {
  // Create 15 levels with the new point structure
  const levels = Array.from({ length: 15 }, (_, index) => {
    const config = getQuestionConfig(index);
    return {
      level: index + 1,
      points: config.points,
      timeLimit: config.timeLimit
    };
  });
  
  // Reverse to display in descending order
  const reversedLevels = [...levels].reverse();
  
  // Get the class name for a level
  const getLevelClass = (index: number) => {
    const levelIndex = 14 - index; // Convert back to original index
    let className = "p-1 text-center rounded-md flex justify-between items-center text-xs";
    
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
      <h2 className="text-base font-bold text-center mb-2 text-millionaire-gold">Points Ladder</h2>
      <div className="space-y-0.5">
        {reversedLevels.map((level, index) => (
          <div key={index} className={getLevelClass(index)}>
            <span className="w-4 text-center">{level.level}</span>
            <span className="flex-1 text-center">
              {level.points} pts
            </span>
            <span className="w-8 text-center text-xs opacity-75">
              {level.timeLimit}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoneyLadder;
