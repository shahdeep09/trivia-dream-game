
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Volume2, VolumeX, Undo, CheckCircle } from "lucide-react";
import { GameAction } from "@/utils/game/types";

interface GameControlsProps {
  gameStarted: boolean;
  isMuted: boolean;
  selectedOption: number | null;
  revealAnswer: boolean;
  gameOver: boolean;
  timerPaused: boolean;
  actionHistory: GameAction[];
  onStartGame: () => void;
  onToggleMute: () => void;
  onUndo: () => void;
  onFinalAnswer: () => void;
  onToggleTimerPause: () => void;
  onWalkAway: () => void;
}

const GameControls = ({
  gameStarted,
  isMuted,
  selectedOption,
  revealAnswer,
  gameOver,
  timerPaused,
  actionHistory,
  onStartGame,
  onToggleMute,
  onUndo,
  onFinalAnswer,
  onToggleTimerPause,
  onWalkAway
}: GameControlsProps) => {
  return (
    <div className="flex gap-2">
      {/* Mute Button */}
      <Button
        variant="outline"
        className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent flex items-center gap-1"
        onClick={onToggleMute}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </Button>
      
      {!gameStarted && (
        <Button
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          onClick={onStartGame}
        >
          <Play size={16} />
          Start Game
        </Button>
      )}
      {gameStarted && (
        <>
          <Button
            variant="outline"
            className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent flex items-center gap-1"
            onClick={onUndo}
            disabled={actionHistory.length === 0}
          >
            <Undo size={16} />
            Undo
          </Button>
          <Button
            variant="outline"
            className="border-millionaire-gold text-millionaire-gold hover:bg-millionaire-gold hover:text-millionaire-primary flex items-center gap-1"
            onClick={onFinalAnswer}
            disabled={selectedOption === null || revealAnswer}
          >
            <CheckCircle size={16} />
            Final Answer (Space)
          </Button>
          <Button
            variant="outline"
            className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent"
            onClick={onToggleTimerPause}
          >
            {timerPaused ? "Resume Timer" : "Pause Timer"}
          </Button>
          <Button
            variant="outline"
            className="border-millionaire-gold text-millionaire-gold hover:bg-millionaire-gold hover:text-millionaire-primary"
            onClick={onWalkAway}
            disabled={gameOver}
          >
            Walk Away
          </Button>
        </>
      )}
    </div>
  );
};

export default GameControls;
