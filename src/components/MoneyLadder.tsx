
import { MONEY_VALUES, MILESTONE_VALUES, formatMoney } from "@/utils/gameUtils";

interface MoneyLadderProps {
  currentLevel: number;
}

const MoneyLadder = ({ currentLevel }: MoneyLadderProps) => {
  return (
    <div className="w-full max-w-xs bg-millionaire-dark p-4 rounded-md border border-millionaire-accent">
      <h2 className="text-center text-millionaire-gold font-bold mb-4">Money Ladder</h2>
      <div className="flex flex-col-reverse">
        {MONEY_VALUES.map((value, index) => {
          const level = MONEY_VALUES.length - index;
          const isCurrent = level === currentLevel + 1;
          const isMilestone = MILESTONE_VALUES.includes(value);
          
          return (
            <div
              key={value}
              className={`money-ladder-item ${isCurrent ? 'active' : ''} ${
                isMilestone ? 'milestone' : ''
              }`}
            >
              <div className="flex justify-between">
                <span>{level}</span>
                <span>{formatMoney(value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoneyLadder;
