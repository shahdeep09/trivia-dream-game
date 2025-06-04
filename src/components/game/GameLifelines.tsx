
import React from "react";
import Lifeline from "../Lifeline";
import { Question, GameSettings } from "@/utils/game/types";
import { QuizConfig } from "@/types/quiz";

interface GameLifelinesProps {
  quizConfig: QuizConfig;
  lifelinesUsed: Record<string, boolean>;
  currentQuestion: Question;
  settings: GameSettings;
  onUseLifeline: (lifelineId: string, result: any) => void;
}

const GameLifelines = ({
  quizConfig,
  lifelinesUsed,
  currentQuestion,
  settings,
  onUseLifeline
}: GameLifelinesProps) => {
  if (!quizConfig.selectedLifelines) return null;
  
  return (
    <div className="flex justify-center gap-6">
      {quizConfig.selectedLifelines.map((lifelineId, index) => (
        <Lifeline
          key={`${lifelineId}-${index}`}
          lifelineId={lifelineId}
          isUsed={lifelinesUsed[lifelineId] || false}
          onUse={onUseLifeline}
          currentQuestion={currentQuestion}
          settings={settings}
          quizConfig={quizConfig}
        />
      ))}
    </div>
  );
};

export default GameLifelines;
