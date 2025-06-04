
import React from "react";
import { formatMoney } from "@/utils/game/questionUtils";

interface GameInfoProps {
  teamName: string;
  cumulativePoints: number;
}

const GameInfo = ({ teamName, cumulativePoints }: GameInfoProps) => {
  return (
    <div className="flex items-center gap-4">
      {teamName && (
        <div className="bg-millionaire-secondary px-4 py-2 rounded-lg text-center">
          <span className="text-millionaire-gold font-bold mr-2">Team:</span>
          <span className="text-white font-medium">{teamName}</span>
        </div>
      )}
      
      <div className="text-millionaire-gold font-bold text-2xl">
        Total: {formatMoney(cumulativePoints)}
      </div>
    </div>
  );
};

export default GameInfo;
