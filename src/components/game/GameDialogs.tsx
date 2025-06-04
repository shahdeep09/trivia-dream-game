
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Question } from "@/utils/game/types";
import { formatMoney } from "@/utils/game/questionUtils";

interface GameDialogsProps {
  dialogOpen: boolean;
  resultDialogOpen: boolean;
  gameOver: boolean;
  gameWon: boolean;
  dialogMessage: string;
  showExplanation: boolean;
  currentQuestion: Question;
  cumulativePoints: number;
  currentQuestionIndex: number;
  onDialogOpenChange: (open: boolean) => void;
  onResultDialogOpenChange: (open: boolean) => void;
  onNextQuestion: () => void;
  onGameEnd: () => void;
}

const GameDialogs = ({
  dialogOpen,
  resultDialogOpen,
  gameOver,
  gameWon,
  dialogMessage,
  showExplanation,
  currentQuestion,
  cumulativePoints,
  currentQuestionIndex,
  onDialogOpenChange,
  onResultDialogOpenChange,
  onNextQuestion,
  onGameEnd
}: GameDialogsProps) => {
  return (
    <>
      {/* Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="bg-millionaire-primary border-millionaire-accent">
          <DialogHeader>
            <DialogTitle className="text-millionaire-gold">{gameOver ? "Game Over" : "Correct!"}</DialogTitle>
            <DialogDescription className="text-millionaire-light text-lg whitespace-pre-line">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          
          {showExplanation && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-millionaire-secondary rounded-md">
              <h3 className="font-bold text-millionaire-gold mb-2">Explanation:</h3>
              <p className="text-millionaire-light">{currentQuestion.explanation}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={onNextQuestion}
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              {gameOver ? "See Results" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Final Results Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={onResultDialogOpenChange}>
        <DialogContent className="bg-millionaire-primary border-millionaire-accent">
          <DialogHeader>
            <DialogTitle className="text-millionaire-gold text-center text-2xl mb-4">
              {gameWon ? "Congratulations!" : "Game Over"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            {gameWon ? (
              <div className="animate-pulse">
                <h3 className="text-3xl font-bold text-millionaire-gold mb-4">
                  You're a Millionaire!
                </h3>
                <p className="text-xl mb-6">
                  You've won {formatMoney(cumulativePoints)}!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-4">
                  You made it to question #{currentQuestionIndex + 1}
                </p>
                <p className="text-xl font-bold mb-6">
                  You walk away with {formatMoney(cumulativePoints)}
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-millionaire-accent"
              >
                Back to Home
              </Button>
              <Button
                onClick={onGameEnd}
                className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
              >
                Save Results
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GameDialogs;
