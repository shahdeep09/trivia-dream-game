import { useState, useEffect } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, POINTS_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, playSound, shuffleOptions, Team, GameAction, addGameAction, undoLastAction, getQuestionConfig } from "@/utils/gameUtils";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo, CheckCircle, Play } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { ScrollArea } from "@/components/ui/scroll-area";
import Lifeline from "./Lifeline";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GameScreenProps {
  questions: QuestionType[];
  settings?: GameSettings;
  onGameEnd: (result: GameResult) => void;
  onBackToAdmin: () => void;
  teamId?: string | null;
  quizConfig: QuizConfig;
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
  teamId,
  quizConfig
}: GameScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<QuestionType[]>([]);
  const [moneyWon, setMoneyWon] = useState(0);
  const [cumulativePoints, setCumulativePoints] = useState(0);
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
  const [gameStarted, setGameStarted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  
  // Lifelines - map to generic types but track by quiz config
  const [lifelinesUsed, setLifelinesUsed] = useState<Record<string, boolean>>({});
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [totalLifelinesUsedInGame, setTotalLifelinesUsedInGame] = useState(0);
  
  // Action history for undo functionality
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);

  // Initialize lifelines based on quiz config
  useEffect(() => {
    if (quizConfig?.selectedLifelines) {
      const initialLifelines: Record<string, boolean> = {};
      quizConfig.selectedLifelines.forEach(lifeline => {
        initialLifelines[lifeline] = false;
      });
      setLifelinesUsed(initialLifelines);
    }
  }, [quizConfig]);

  // Prepare questions when game starts
  useEffect(() => {
    if (questions.length > 0 && quizConfig) {
      const sortedQuestions = [...questions].sort((a, b) => a.value - b.value);
      
      const preparedQuestions = sortedQuestions.slice(0, quizConfig.numberOfQuestions).map((q, index) => {
        const config = quizConfig.questionConfig[index] || { points: 100, timeLimit: 30 };
        return {
          ...shuffleOptions(q),
          value: config.points
        };
      });
      
      setGameQuestions(preparedQuestions);
    }
  }, [questions, quizConfig]);

  // Add spacebar shortcut for final answer
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && selectedOption !== null && !revealAnswer && gameStarted) {
        event.preventDefault();
        handleFinalAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, revealAnswer, gameStarted]);

  const currentQuestion = gameQuestions[currentQuestionIndex];
  
  const handleStartGame = () => {
    setGameStarted(true);
    playSound("lets-play", settings);
  };

  const handleAnswer = (selectedIndex: number) => {
    setSelectedOption(selectedIndex);
    setRevealAnswer(true);
    setShowResult(true);
    setTimerPaused(true);
    
    const answerAction: GameAction = {
      type: 'ANSWER',
      data: { selectedIndex, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, answerAction]);
    
    const isCorrect = selectedIndex === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      if (currentQuestionIndex < 5) {
        playSound("fast-forward", settings, currentQuestionIndex);
      } else {
        playSound("correct", settings);
      }
      
      const newCumulativePoints = cumulativePoints + currentQuestion.value;
      setCumulativePoints(newCumulativePoints);
      setMoneyWon(newCumulativePoints);
      
      setTimeout(() => {
        if (currentQuestionIndex === gameQuestions.length - 1) {
          setGameWon(true);
          setGameOver(true);
          playSound("win", settings);
          setShowConfetti(true);
          setDialogMessage(`Congratulations! You've won ${formatMoney(newCumulativePoints)}!`);
        } else {
          setDialogMessage(`Correct! You now have ${formatMoney(newCumulativePoints)}`);
          
          if (currentQuestion.explanation) {
            setShowExplanation(true);
          }
        }
        setDialogOpen(true);
      }, 2000);
    } else {
      playSound("wrong", settings);
      
      setTimeout(() => {
        setGameOver(true);
        setDialogMessage(
          `Sorry, that's incorrect. The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.
          You leave with ${formatMoney(cumulativePoints)}`
        );
        setMoneyWon(cumulativePoints);
        
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
    
    const timeoutAction: GameAction = {
      type: 'ANSWER',
      data: { timeout: true, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, timeoutAction]);
  };

  const handleUseLifeline = (lifelineId: string, result: any) => {
    setLifelinesUsed({ ...lifelinesUsed, [lifelineId]: true });
    setTotalLifelinesUsedInGame(totalLifelinesUsedInGame + 1);
    playSound("lifeline", settings);
    
    // Only apply fifty-fifty effect for actual fifty-fifty lifeline
    if (lifelineId === "fifty-fifty" && result) {
      setDisabledOptions(result);
    }
    
    const lifelineAction: GameAction = {
      type: 'LIFELINE',
      data: { type: lifelineId, result }
    };
    setActionHistory([...actionHistory, lifelineAction]);
  };
  
  const updateTeamData = async (teamToUpdate: Team, pointsToAdd: number) => {
    console.log('Updating team data:', teamToUpdate.name, 'Adding points:', pointsToAdd);
    
    try {
      const updatedTeam = {
        ...teamToUpdate,
        points: teamToUpdate.points + pointsToAdd,
        gamesPlayed: teamToUpdate.gamesPlayed + 1,
        totalLifelinesUsed: (teamToUpdate.totalLifelinesUsed || 0) + totalLifelinesUsedInGame
      };

      // Get current user from auth context - properly await the promise
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user found:', userError);
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        return;
      }

      // Update in Supabase with proper user isolation
      if (quizConfig?.id && teamId) {
        console.log('Updating team in Supabase:', teamId, 'Quiz:', quizConfig.id, 'User:', user.id);
        const { error } = await supabase
          .from('teams')
          .update({
            points: updatedTeam.points,
            games_played: updatedTeam.gamesPlayed,
            total_lifelines_used: updatedTeam.totalLifelinesUsed,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId)
          .eq('quiz_id', quizConfig.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating team in Supabase:', error);
          toast({
            title: "Error",
            description: "Failed to save points to database",
            variant: "destructive"
          });
        } else {
          console.log('Team updated in Supabase successfully');
          toast({
            title: "Points Saved",
            description: `${pointsToAdd} points added to ${teamToUpdate.name}`,
          });
        }
      }

      // Update localStorage with user-specific key
      const userSpecificKey = `teams-${quizConfig.id}-${user.id}`;
      const savedTeams = localStorage.getItem(userSpecificKey);
      
      if (savedTeams) {
        const teams: Team[] = JSON.parse(savedTeams);
        const teamIndex = teams.findIndex(team => team.id === teamId);
        
        if (teamIndex !== -1) {
          teams[teamIndex] = updatedTeam;
          localStorage.setItem(userSpecificKey, JSON.stringify(teams));
          
          // Also update the main quiz-teams for backward compatibility
          localStorage.setItem("quiz-teams", JSON.stringify(teams));
          
          // Dispatch update event with quiz and user isolation
          const customEvent = new CustomEvent('teamDataUpdated', { 
            detail: { 
              teamId, 
              pointsAdded: pointsToAdd, 
              gamesPlayed: 1, 
              lifelinesUsed: totalLifelinesUsedInGame,
              quizId: quizConfig.id,
              userId: user.id,
              timestamp: Date.now()
            } 
          });
          window.dispatchEvent(customEvent);
        }
      }
    } catch (error) {
      console.error('Error updating team data:', error);
      toast({
        title: "Error",
        description: "Failed to save game results",
        variant: "destructive"
      });
    }
  };

  const handleGameEnd = () => {
    setResultDialogOpen(false);
    setShowConfetti(false);

    // Update team data with the new function
    if (teamId) {
      const savedTeams = localStorage.getItem(`teams-${quizConfig.id}`) || localStorage.getItem("quiz-teams");
      if (savedTeams) {
        const teams: Team[] = JSON.parse(savedTeams);
        const team = teams.find(t => t.id === teamId);
        if (team) {
          updateTeamData(team, cumulativePoints);
        }
      }
    }
    
    const gameResult: GameResult = {
      totalWon: cumulativePoints,
      questionLevel: currentQuestionIndex + 1,
      isWinner: gameWon,
      teamId
    };
    
    console.log('Calling onGameEnd with result:', gameResult);
    onGameEnd(gameResult);
    
    // Redirect to home page (Teams tab)
    navigate('/');
  };

  const handleWalkAway = () => {
    setGameOver(true);
    setDialogMessage(
      `You've decided to walk away with ${formatMoney(cumulativePoints)}.
       The correct answer was ${currentQuestion.options[currentQuestion.correctOptionIndex]}.`
    );
    setDialogOpen(true);
    
    const walkAwayAction: GameAction = {
      type: 'WALK_AWAY',
      data: { moneyWon: cumulativePoints, questionIndex: currentQuestionIndex }
    };
    setActionHistory([...actionHistory, walkAwayAction]);
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setTimerPaused(true);
  };

  const toggleTimerPause = () => {
    setTimerPaused(!timerPaused);
    if (!timerPaused && currentQuestionIndex < 5) {
      playSound("fast-forward", settings, currentQuestionIndex);
    }
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = [...actionHistory].pop();
    setActionHistory(actionHistory.slice(0, -1));
    
    if (lastAction) {
      switch (lastAction.type) {
        case 'LIFELINE':
          const { type } = lastAction.data;
          setLifelinesUsed({ ...lifelinesUsed, [type]: false });
          setTotalLifelinesUsedInGame(Math.max(0, totalLifelinesUsedInGame - 1));
          if (type === "fifty-fifty") {
            setDisabledOptions([]);
          }
          break;
          
        case 'ANSWER':
          break;
          
        case 'WALK_AWAY':
          setGameOver(false);
          setDialogOpen(false);
          break;
      }
    }
  };

  const handleFinalAnswer = () => {
    if (selectedOption !== null && !revealAnswer && gameStarted) {
      handleAnswer(selectedOption);
    }
  };

  const getCurrentTeamName = (): string => {
    if (!teamId) return "";
    
    // Try user-specific teams first by getting current user properly
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userSpecificKey = `teams-${quizConfig.id}-${user.id}`;
        const userTeams = localStorage.getItem(userSpecificKey);
        if (userTeams) {
          const teams: Team[] = JSON.parse(userTeams);
          const team = teams.find(t => t.id === teamId);
          if (team) return team.name;
        }
      }
      
      // Fallback to general teams
      const savedTeams = localStorage.getItem("quiz-teams");
      if (savedTeams) {
        const teams: Team[] = JSON.parse(savedTeams);
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : "";
      }
      
      return "";
    };

    // Since this is a render function, we'll use a different approach
    // Try general teams first as fallback
    const savedTeams = localStorage.getItem("quiz-teams");
    if (savedTeams) {
      const teams: Team[] = JSON.parse(savedTeams);
      const team = teams.find(t => t.id === teamId);
      return team ? team.name : "";
    }
    
    return "";
  };

  const teamName = getCurrentTeamName();
  const currentConfig = quizConfig.questionConfig[currentQuestionIndex] || { points: 100, timeLimit: 30 };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl mb-4">Loading questions...</h2>
        <Button onClick={onBackToAdmin}>Back to Admin</Button>
      </div>
    );
  }

  const renderLifelines = () => {
    if (!quizConfig.selectedLifelines) return null;
    
    return quizConfig.selectedLifelines.map((lifelineId, index) => (
      <Lifeline
        key={`${lifelineId}-${index}`}
        lifelineId={lifelineId}
        isUsed={lifelinesUsed[lifelineId] || false}
        onUse={handleUseLifeline}
        currentQuestion={currentQuestion}
        settings={settings}
        quizConfig={quizConfig}
      />
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-millionaire-dark text-millionaire-light overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width || 0}
          height={windowSize.height || 0}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      
      {/* Header with Samaj name and logo */}
      <div className="bg-millionaire-primary border-b border-millionaire-accent p-4">
        <div className="flex items-center justify-center">
          {quizConfig.logo && (
            <img 
              src={quizConfig.logo} 
              alt="Quiz Logo" 
              className="w-12 h-12 object-cover rounded mr-4"
            />
          )}
          <h1 className="text-3xl font-bold text-millionaire-gold">{quizConfig.samajName}</h1>
        </div>
      </div>
      
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

        {/* Lifelines */}
        <div className="flex justify-center gap-6">
          {renderLifelines()}
        </div>
        
        <div className="flex gap-2">
          {!gameStarted && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={handleStartGame}
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
                Final Answer (Space)
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
            </>
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Money ladder - reduced width from md:w-1/4 to md:w-1/5 */}
        <div className="md:w-1/5 bg-millionaire-primary border-r border-millionaire-accent overflow-hidden">
          <ScrollArea className="h-[calc(100vh-128px)]">
            <div className="p-4">
              <MoneyLadder currentLevel={currentQuestionIndex} quizConfig={quizConfig} />
            </div>
          </ScrollArea>
        </div>
        
        {/* Question area - increased width from md:w-3/4 to md:w-4/5 */}
        <div className="md:w-4/5 flex-grow flex flex-col items-center justify-center p-4">
          {!gameStarted ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-millionaire-gold mb-4">Ready to Play?</h2>
                <p className="text-xl text-millionaire-light mb-8">
                  Press the Start Game button when you're ready to begin!
                </p>
                {teamName && (
                  <p className="text-lg text-millionaire-accent">
                    Playing as: <span className="font-bold">{teamName}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
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
              timeLimit={currentConfig.timeLimit}
              quizLogo={quizConfig.logo}
            />
          )}
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
                onClick={() => window.location.href = '/'}
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
