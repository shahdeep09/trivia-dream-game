
import { useState, useEffect } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, MONEY_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, playSound, shuffleOptions } from "@/utils/gameUtils";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import Timer from "./Timer";
import Lifeline from "./Lifeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameScreenProps {
  questions: QuestionType[];
  settings?: GameSettings;
  onGameEnd: (result: GameResult) => void;
  onBackToAdmin: () => void;
}

export interface GameResult {
  totalWon: number;
  questionLevel: number;
  isWinner: boolean;
}

const GameScreen = ({
  questions,
  settings = DEFAULT_GAME_SETTINGS,
  onGameEnd,
  onBackToAdmin
}: GameScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<QuestionType[]>([]);
  const [moneyWon, setMoneyWon] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [timerPaused, setTimerPaused] = useState(false);
  
  // Lifelines
  const [lifelinesUsed, setLifelinesUsed] = useState({
    "fifty-fifty": false,
    "phone-friend": false,
    "ask-audience": false,
  });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  
  // Prepare questions when game starts
  useEffect(() => {
    if (questions.length > 0) {
      // Sort questions by value/difficulty
      const sortedQuestions = [...questions].sort((a, b) => a.value - b.value);
      
      // Shuffle options for each question
      const preparedQuestions = sortedQuestions.map(q => shuffleOptions(q));
      
      setGameQuestions(preparedQuestions);
      playSound("lets-play", settings);
    }
  }, [questions, settings]);

  const currentQuestion = gameQuestions[currentQuestionIndex];
  
  const handleAnswer = (selectedIndex: number) => {
    setSelectedOption(selectedIndex);
    setRevealAnswer(true);
    setShowResult(true);
    setTimerPaused(true);
    
    const isCorrect = selectedIndex === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      // Play correct answer sound
      playSound("correct", settings);
      
      // Update money won
      setMoneyWon(currentQuestion.value);
      
      // Wait a moment and then show dialog
      setTimeout(() => {
        if (currentQuestionIndex === gameQuestions.length - 1) {
          // User won the game!
          setGameWon(true);
          setGameOver(true);
          playSound("win", settings);
          setDialogMessage(`Congratulations! You've won ${formatMoney(currentQuestion.value)}!`);
        } else {
          setDialogMessage(`Correct! You now have ${formatMoney(currentQuestion.value)}`);
        }
        setDialogOpen(true);
      }, 2000);
    } else {
      // Play wrong answer sound
      playSound("wrong", settings);
      
      // Game over - set guaranteed money
      const guaranteedMoney = getGuaranteedMoney(currentQuestionIndex);
      setTimeout(() => {
        setGameOver(true);
        setDialogMessage(
          `Sorry, that's incorrect. The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.
          You leave with ${formatMoney(guaranteedMoney)}`
        );
        setMoneyWon(guaranteedMoney);
        setDialogOpen(true);
      }, 2000);
    }
  };

  const handleNextQuestion = () => {
    setDialogOpen(false);
    
    if (gameOver) {
      setResultDialogOpen(true);
      return;
    }
    
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRevealAnswer(false);
      setShowResult(false);
      setSelectedOption(null);
      setDisabledOptions([]);
      setTimerPaused(false);
    }
  };

  const handleTimeUp = () => {
    setGameOver(true);
    const guaranteedMoney = getGuaranteedMoney(currentQuestionIndex);
    setMoneyWon(guaranteedMoney);
    setDialogMessage(
      `Time's up! You ran out of time.
      You leave with ${formatMoney(guaranteedMoney)}`
    );
    setDialogOpen(true);
  };

  const handleUseLifeline = (type: "fifty-fifty" | "phone-friend" | "ask-audience", result: any) => {
    setLifelinesUsed({ ...lifelinesUsed, [type]: true });
    playSound("lifeline", settings);
    
    if (type === "fifty-fifty") {
      setDisabledOptions(result);
    }
  };
  
  const handleGameEnd = () => {
    setResultDialogOpen(false);
    onGameEnd({
      totalWon: moneyWon,
      questionLevel: currentQuestionIndex + 1,
      isWinner: gameWon,
    });
  };

  const handleWalkAway = () => {
    setGameOver(true);
    setDialogMessage(
      `You've decided to walk away with ${formatMoney(moneyWon)}.
       The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.`
    );
    setDialogOpen(true);
  };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl mb-4">Loading questions...</h2>
        <Button onClick={onBackToAdmin}>Back to Admin</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-millionaire-dark text-millionaire-light p-4 md:p-8 gap-4 overflow-hidden">
      {/* Left side - Money Ladder */}
      <div className="md:w-1/4 flex flex-col justify-between">
        <MoneyLadder currentLevel={currentQuestionIndex} />
        
        <div className="mt-4 flex flex-row md:flex-col gap-4 justify-center">
          <Lifeline
            type="fifty-fifty"
            isUsed={lifelinesUsed["fifty-fifty"]}
            onUse={handleUseLifeline}
            currentQuestion={currentQuestion}
            settings={settings}
          />
          <Lifeline
            type="phone-friend"
            isUsed={lifelinesUsed["phone-friend"]}
            onUse={handleUseLifeline}
            currentQuestion={currentQuestion}
            settings={settings}
          />
          <Lifeline
            type="ask-audience"
            isUsed={lifelinesUsed["ask-audience"]}
            onUse={handleUseLifeline}
            currentQuestion={currentQuestion}
            settings={settings}
          />
        </div>
      </div>
      
      {/* Main Game Area */}
      <div className="md:w-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="text-millionaire-gold font-bold text-2xl">
            {formatMoney(currentQuestion.value)}
          </div>
          <Button
            variant="outline"
            className="border-millionaire-gold text-millionaire-gold hover:bg-millionaire-gold hover:text-millionaire-primary"
            onClick={handleWalkAway}
            disabled={gameOver}
          >
            Walk Away
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <Question
            question={currentQuestion}
            onAnswer={handleAnswer}
            revealAnswer={revealAnswer}
            disabledOptions={disabledOptions}
            settings={settings}
            selectedOption={selectedOption}
            showResult={showResult}
          />
        </div>
        
        <Timer
          isActive={!gameOver && !revealAnswer}
          onTimeUp={handleTimeUp}
          settings={settings}
          isPaused={timerPaused}
        />
      </div>
      
      {/* Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-millionaire-primary border-millionaire-accent">
          <DialogHeader>
            <DialogTitle className="text-millionaire-gold">{gameOver ? "Game Over" : "Correct!"}</DialogTitle>
            <DialogDescription className="text-millionaire-light text-lg whitespace-pre-line">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleNextQuestion}
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              {gameOver ? "See Results" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Final Results Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
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
                  You've won {formatMoney(moneyWon)}!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-4">
                  You made it to question #{currentQuestionIndex + 1}
                </p>
                <p className="text-xl font-bold mb-6">
                  You walk away with {formatMoney(moneyWon)}
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={onBackToAdmin}
                variant="outline"
                className="border-millionaire-accent"
              >
                Manage Questions
              </Button>
              <Button
                onClick={handleGameEnd}
                className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
              >
                Play Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameScreen;
