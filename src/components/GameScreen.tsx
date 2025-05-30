import { useState, useEffect } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, POINTS_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, playSound, shuffleOptions, Team, GameAction, addGameAction, undoLastAction, getQuestionConfig } from "@/utils/gameUtils";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo, CheckCircle } from "lucide-react"; // Import Undo icon
import Confetti from "react-confetti"; // We'll need to install this package
import { useWindowSize } from "@/hooks/use-window-size"; // Custom hook for window size
import { ScrollArea } from "@/components/ui/scroll-area";
import Lifeline from "./Lifeline";

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
  const [cumulativePoints, setCumulativePoints] = useState(0); // New state for cumulative points
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
  const [totalLifelinesUsedInGame, setTotalLifelinesUsedInGame] = useState(0); // New state for tracking lifelines used in current game
  
  // Action history for undo functionality
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);

  // Prepare questions when game starts
  useEffect(() => {
    if (questions.length > 0) {
      // Sort questions by value/difficulty
      const sortedQuestions = [...questions].sort((a, b) => a.value - b.value);
      
      // Update questions with new point values based on position
      const preparedQuestions = sortedQuestions.slice(0, 15).map((q, index) => {
        const config = getQuestionConfig(index);
        return {
          ...shuffleOptions(q),
          value: config.points
        };
      });
      
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
      
      // Update cumulative points and money won
      const newCumulativePoints = cumulativePoints + currentQuestion.value;
      setCumulativePoints(newCumulativePoints);
      setMoneyWon(newCumulativePoints);
      
      // Wait a moment and then show dialog
      setTimeout(() => {
        if (currentQuestionIndex === gameQuestions.length - 1) {
          // User won the game!
          setGameWon(true);
          setGameOver(true);
          playSound("win", settings);
          setShowConfetti(true); // Show confetti for winning on the last question
          setDialogMessage(`Congratulations! You've won ${formatMoney(newCumulativePoints)}!`);
        } else {
          setDialogMessage(`Correct! You now have ${formatMoney(newCumulativePoints)}`);
          
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
      
      // Game over - keep cumulative points earned so far
      setTimeout(() => {
        setGameOver(true);
        setDialogMessage(
          `Sorry, that's incorrect. The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.
          You leave with ${formatMoney(cumulativePoints)}`
        );
        setMoneyWon(cumulativePoints);
        
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
    setDialogMessage(
      `Time's up! You ran out of time.
      You leave with ${formatMoney(cumulativePoints)}`
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
    setTotalLifelinesUsedInGame(totalLifelinesUsedInGame + 1); // Increment lifeline usage count
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

    // Update team score and lifeline usage if a team is playing
    if (teamId) {
      const savedTeams = localStorage.getItem("millionaire-teams");
      if (savedTeams) {
        const teams: Team[] = JSON.parse(savedTeams);
        const updatedTeams = teams.map(team => {
          if (team.id === teamId) {
            return {
              ...team,
              points: team.points + cumulativePoints, // Use cumulative points
              gamesPlayed: team.gamesPlayed + 1,
              totalLifelinesUsed: (team.totalLifelinesUsed || 0) + totalLifelinesUsedInGame
            };
          }
          return team;
        });
        localStorage.setItem("millionaire-teams", JSON.stringify(updatedTeams));
      }
    }
    
    onGameEnd({
      totalWon: cumulativePoints, // Use cumulative points
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
      `You've decided to walk away with ${formatMoney(cumulativePoints)}.
       The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.`
    );
    setDialogOpen(true);
    
    // Add walk away action to history
    const walkAwayAction: GameAction = {
      type: 'WALK_AWAY',
      data: { moneyWon: cumulativePoints, questionIndex: currentQuestionIndex }
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
          setTotalLifelinesUsedInGame(Math.max(0, totalLifelinesUsedInGame - 1));
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

  // Handle final answer confirmation
  const handleFinalAnswer = () => {
    if (selectedOption !== null && !revealAnswer) {
      handleAnswer(selectedOption);
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
  const currentConfig = getQuestionConfig(currentQuestionIndex);

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl mb-4">Loading questions...</h2>
        <Button onClick={onBackToAdmin}>Back to Admin</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-millionaire-dark text-millionaire-light overflow-hidden">
      {/* Confetti overlay - only shown when winning the last question */}
      {showConfetti && (
        <Confetti
          width={windowSize.width || 0}
          height={windowSize.height || 0}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      
      {/* Control bar */}
      <div className="flex justify-between items-center p-4 bg-millionaire-primary border-b border-millionaire-accent">
        <div className="flex items-center gap-4">
          {teamName && (
            <div className="bg-millionaire-secondary px-4 py-2 rounded-lg text-center">
              <span className="text-millionaire-gold font-bold mr-2">Team:</span>
              <span>{teamName}</span>
            </div>
          )}
          
          <div className="text-millionaire-gold font-bold text-2xl">
            Total: {formatMoney(cumulativePoints)}
          </div>
        </div>

        {/* Lifelines in the center (red box area) */}
        <div className="flex justify-center gap-6">
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
            className="border-millionaire-gold text-millionaire-gold hover:bg-millionaire-gold hover:text-millionaire-primary flex items-center gap-1"
            onClick={handleFinalAnswer}
            disabled={selectedOption === null || revealAnswer}
          >
            <CheckCircle size={16} />
            Final Answer
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
      
      {/* Main content area - Full height and scrollable */}
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Money ladder - Collapsible on mobile */}
        <div className="md:w-1/4 bg-millionaire-primary border-r border-millionaire-accent overflow-hidden">
          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-4">
              <MoneyLadder currentLevel={currentQuestionIndex} />
            </div>
          </ScrollArea>
        </div>
        
        {/* Question area - Full width */}
        <div className="md:w-3/4 flex-grow flex flex-col items-center justify-center p-4">
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
            questionIndex={currentQuestionIndex}
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
