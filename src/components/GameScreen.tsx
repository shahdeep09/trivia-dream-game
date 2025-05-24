import { useState, useEffect } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, POINTS_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, playSound, shuffleOptions, Team, GameAction, addGameAction, undoLastAction } from "@/utils/gameUtils";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo } from "lucide-react"; // Import Undo icon
import Confetti from "react-confetti"; // We'll need to install this package
import { useWindowSize } from "@/hooks/use-window-size"; // Custom hook for window size
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameScreenProps {
  questions: QuestionType[];
  settings?: GameSettings;
  onGameEnd: (result: GameResult) => void;
  onBackToAdmin: () => void;
  teamId?: string | null;
}

export interface GameResult {
  totalWon: number;
  questionLevel: number;
  isWinner: boolean;
  teamId?: string | null;
}

const GameScreen = ({
  questions,
  settings = DEFAULT_GAME_SETTINGS,
  onGameEnd,
  onBackToAdmin,
  teamId
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  
  // Lifelines
  const [lifelinesUsed, setLifelinesUsed] = useState({
    "fifty-fifty": false,
    "phone-friend": false,
    "ask-audience": false,
  });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  
  // Action history for undo functionality
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);
  
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
    
    // Add answer action to history
    const answerAction: GameAction = {
      type: 'ANSWER',
      data: { selectedIndex, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, answerAction]);
    
    const isCorrect = selectedIndex === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      // Play the appropriate sound based on question level
      if (currentQuestionIndex < 5) {
        playSound("fast-forward", settings, currentQuestionIndex);
      } else {
        playSound("correct", settings);
      }
      
      // Update money won - always get points for correct answers regardless of question number
      setMoneyWon(currentQuestion.value);
      
      // Wait a moment and then show dialog
      setTimeout(() => {
        if (currentQuestionIndex === gameQuestions.length - 1) {
          // User won the game!
          setGameWon(true);
          setGameOver(true);
          playSound("win", settings);
          setShowConfetti(true); // Show confetti for winning on the last question
          setDialogMessage(`Congratulations! You've won ${formatMoney(currentQuestion.value)}!`);
        } else {
          setDialogMessage(`Correct! You now have ${formatMoney(currentQuestion.value)}`);
          
          // Check if we should show explanation
          if (currentQuestion.explanation) {
            setShowExplanation(true);
          }
        }
        setDialogOpen(true);
      }, 2000);
    } else {
      // Play wrong answer sound
      playSound("wrong", settings);
      
      // Game over - set earned money
      const earnedMoney = moneyWon; // Just keep what they've earned
      setTimeout(() => {
        setGameOver(true);
        setDialogMessage(
          `Sorry, that's incorrect. The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.
          You leave with ${formatMoney(earnedMoney)}`
        );
        setMoneyWon(earnedMoney);
        
        // Check if we should show explanation
        if (currentQuestion.explanation) {
          setShowExplanation(true);
        }
        
        setDialogOpen(true);
      }, 2000);
    }
  };

  const handleNextQuestion = () => {
    setDialogOpen(false);
    setShowExplanation(false);
    
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
    // You get to keep what you've earned
    setDialogMessage(
      `Time's up! You ran out of time.
      You leave with ${formatMoney(moneyWon)}`
    );
    setDialogOpen(true);
    
    // Add timeout action to history
    const timeoutAction: GameAction = {
      type: 'ANSWER',
      data: { timeout: true, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, timeoutAction]);
  };

  const handleUseLifeline = (type: "fifty-fifty" | "phone-friend" | "ask-audience", result: any) => {
    setLifelinesUsed({ ...lifelinesUsed, [type]: true });
    playSound("lifeline", settings);
    
    if (type === "fifty-fifty") {
      setDisabledOptions(result);
    }
    
    // Add lifeline action to history
    const lifelineAction: GameAction = {
      type: 'LIFELINE',
      data: { type, result }
    };
    setActionHistory([...actionHistory, lifelineAction]);
  };
  
  const handleGameEnd = () => {
    setResultDialogOpen(false);
    setShowConfetti(false);

    // Update team score if a team is playing
    if (teamId) {
      const savedTeams = localStorage.getItem("millionaire-teams");
      if (savedTeams) {
        const teams: Team[] = JSON.parse(savedTeams);
        const updatedTeams = teams.map(team => {
          if (team.id === teamId) {
            return {
              ...team,
              points: team.points + moneyWon,
              gamesPlayed: team.gamesPlayed + 1
            };
          }
          return team;
        });
        localStorage.setItem("millionaire-teams", JSON.stringify(updatedTeams));
      }
    }
    
    onGameEnd({
      totalWon: moneyWon,
      questionLevel: currentQuestionIndex + 1,
      isWinner: gameWon,
      teamId
    });
    
    // Navigate back to home page
    navigate('/');
  };

  const handleWalkAway = () => {
    setGameOver(true);
    setDialogMessage(
      `You've decided to walk away with ${formatMoney(moneyWon)}.
       The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.`
    );
    setDialogOpen(true);
    
    // Add walk away action to history
    const walkAwayAction: GameAction = {
      type: 'WALK_AWAY',
      data: { moneyWon, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, walkAwayAction]);
  };

  const handleOptionSelect = () => {
    setTimerPaused(true);
  };

  // Toggle timer pause state
  const toggleTimerPause = () => {
    setTimerPaused(!timerPaused);
    // If we're un-pausing and we're in the first 5 questions, resume fast-forward sound
    if (!timerPaused && currentQuestionIndex < 5) {
      playSound("fast-forward", settings, currentQuestionIndex);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = [...actionHistory].pop();
    setActionHistory(actionHistory.slice(0, -1));
    
    if (lastAction) {
      switch (lastAction.type) {
        case 'LIFELINE':
          // Undo lifeline usage
          const { type } = lastAction.data;
          setLifelinesUsed({ ...lifelinesUsed, [type]: false });
          if (type === "fifty-fifty") {
            setDisabledOptions([]);
          }
          break;
          
        case 'ANSWER':
          // Can't really undo an answer, but we can reset the game state
          // This would be more complex to implement fully
          break;
          
        case 'WALK_AWAY':
          // Reset game state
          setGameOver(false);
          setDialogOpen(false);
          break;
      }
    }
  };

  // Get the current team name if a team is playing
  const getCurrentTeamName = (): string => {
    if (!teamId) return "";
    
    const savedTeams = localStorage.getItem("millionaire-teams");
    if (savedTeams) {
      const teams: Team[] = JSON.parse(savedTeams);
      const team = teams.find(t => t.id === teamId);
      return team ? team.name : "";
    }
    return "";
  };

  const teamName = getCurrentTeamName();

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl mb-4">Loading questions...</h2>
        <Button onClick={onBackToAdmin}>Back to Admin</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-millionaire-dark text-millionaire-light p-4 md:p-8 gap-4 overflow-hidden relative">
      {/* Confetti overlay - only shown when winning the last question */}
      {showConfetti && (
        <Confetti
          width={windowSize.width || 0}
          height={windowSize.height || 0}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      
      {/* Left side - Money Ladder */}
      <div className="md:w-1/4 overflow-hidden">
        {teamName && (
          <div className="bg-millionaire-secondary p-4 rounded-lg mb-4 text-center">
            <h3 className="text-millionaire-gold font-bold">Team Playing:</h3>
            <p className="text-lg">{teamName}</p>
          </div>
        )}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <MoneyLadder currentLevel={currentQuestionIndex} />
        </ScrollArea>
      </div>
      
      {/* Main Game Area - Removed the extra space by ensuring content fills available width */}
      <div className="md:w-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="text-millionaire-gold font-bold text-2xl">
            {formatMoney(currentQuestion.value)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent flex items-center gap-1"
              onClick={handleUndo}
              disabled={actionHistory.length === 0}
            >
              <Undo size={16} />
              Undo
            </Button>
            <Button
              variant="outline"
              className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent"
              onClick={toggleTimerPause}
            >
              {timerPaused ? "Resume Timer" : "Pause Timer"}
            </Button>
            <Button
              variant="outline"
              className="border-millionaire-gold text-millionaire-gold hover:bg-millionaire-gold hover:text-millionaire-primary"
              onClick={handleWalkAway}
              disabled={gameOver}
            >
              Walk Away
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center w-full">
          <Question
            question={currentQuestion}
            onAnswer={handleAnswer}
            revealAnswer={revealAnswer}
            disabledOptions={disabledOptions}
            settings={settings}
            selectedOption={selectedOption}
            showResult={showResult}
            onOptionSelect={handleOptionSelect}
            onTimeUp={handleTimeUp}
            timerPaused={timerPaused}
            lifelinesUsed={lifelinesUsed}
            onUseLifeline={handleUseLifeline}
          />
        </div>
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
          
          {/* Show explanation if available */}
          {showExplanation && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-millionaire-secondary rounded-md">
              <h3 className="font-bold text-millionaire-gold mb-2">Explanation:</h3>
              <p className="text-millionaire-light">{currentQuestion.explanation}</p>
            </div>
          )}
          
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
                onClick={() => navigate('/')}
                variant="outline"
                className="border-millionaire-accent"
              >
                Back to Home
              </Button>
              <Button
                onClick={handleGameEnd}
                className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
              >
                Save Results
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameScreen;
