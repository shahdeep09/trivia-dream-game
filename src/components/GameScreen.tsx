import { useState, useEffect } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, POINTS_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, playSound, shuffleOptions, Team } from "@/utils/gameUtils";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  
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
  };

  const handleOptionSelect = () => {
    setTimerPaused(true);
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
    <div className="flex flex-col md:flex-row h-screen bg-millionaire-dark text-millionaire-light p-4 md:p-8 gap-4 overflow-hidden">
      {/* Left side - Money Ladder */}
      <div className="md:w-1/4">
        {teamName && (
          <div className="bg-millionaire-secondary p-4 rounded-lg mb-4 text-center">
            <h3 className="text-millionaire-gold font-bold">Team Playing:</h3>
            <p className="text-lg">{teamName}</p>
          </div>
        )}
        <MoneyLadder currentLevel={currentQuestionIndex} />
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
