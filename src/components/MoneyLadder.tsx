
import { POINTS_VALUES, MILESTONE_VALUES } from "@/utils/gameUtils";

interface MoneyLadderProps {
  currentLevel: number;
}

const MoneyLadder = ({ currentLevel }: MoneyLadderProps) => {
  // Reverse the money values to display in descending order
  const reversedValues = [...POINTS_VALUES].reverse();
  
  // Get the class name for a level
  const getLevelClass = (index: number) => {
    const reversedIndex = POINTS_VALUES.length - 1 - index;
    let className = "p-1 text-center rounded-md flex justify-between items-center text-xs";
    
    if (reversedIndex === currentLevel) {
      className += " bg-millionaire-accent text-millionaire-primary font-bold";
    } else if (reversedIndex < currentLevel) {
      className += " bg-millionaire-secondary text-millionaire-gold";
    } else {
      className += " bg-millionaire-primary text-millionaire-light";
    }
    
    // Add special styling for milestone values
    if (MILESTONE_VALUES.includes(reversedValues[index])) {
      className += " border-2 border-millionaire-gold";
    }
    
    return className;
  };
  
  return (
    <div className="bg-millionaire-secondary p-2 rounded-lg shadow-lg h-full">
      <h2 className="text-base font-bold text-center mb-2 text-millionaire-gold">Points Ladder</h2>
      <div className="space-y-0.5">
        {reversedValues.map((value, index) => (
          <div key={index} className={getLevelClass(index)}>
            <span className="w-4 text-center">{POINTS_VALUES.length - index}</span>
            <span className="flex-1 text-right pr-1">
              {new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value)} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoneyLadder;
