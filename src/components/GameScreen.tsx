
import { useState, useEffect, useRef } from "react";
import { Question as QuestionType, DEFAULT_GAME_SETTINGS, GameSettings, POINTS_VALUES, MILESTONE_VALUES, formatMoney, getGuaranteedMoney, shuffleOptions, Team, GameAction, addGameAction, undoLastAction, getQuestionConfig } from "@/utils/gameUtils";
import { soundManager } from "@/utils/sound/SoundManager";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo, CheckCircle, Play, Volume2, VolumeX, ArrowRight } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { ScrollArea } from "@/components/ui/scroll-area";
import Lifeline from "./Lifeline";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [teamName, setTeamName] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [timeUpCalled, setTimeUpCalled] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  const { user } = useAuth();
  
  // Use ref to prevent multiple time-up calls with stronger protection
  const timeUpCalledRef = useRef(false);
  const timeUpProcessingRef = useRef(false);
  
  // Lifelines - map to generic types but track by quiz config
  const [lifelinesUsed, setLifelinesUsed] = useState<Record<string, boolean>>({});
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [totalLifelinesUsedInGame, setTotalLifelinesUsedInGame] = useState(0);
  
  // Action history for undo functionality
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);

  // Update settings when mute state changes
  const currentSettings = {
    ...settings,
    soundEffects: settings.soundEffects && !isMuted
  };

  // Determine if the continue button should be available
  const isContinueAvailable = revealAnswer && lastAnswerCorrect && !dialogOpen && !gameOver;

  // Add keyboard shortcut for continue
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && selectedOption !== null && !revealAnswer && gameStarted) {
        event.preventDefault();
        handleFinalAnswer();
      }
      if (event.code === 'Enter' && isContinueAvailable) {
        event.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, revealAnswer, gameStarted, isContinueAvailable]);

  // Load team name when component mounts
  useEffect(() => {
    const loadTeamName = async () => {
      console.log('Loading team name for teamId:', teamId, 'user:', user?.id, 'quizConfig:', quizConfig?.id);
      
      if (!teamId || !user || !quizConfig?.id) {
        console.log('Missing required data for loading team name');
        setTeamName("");
        return;
      }

      try {
        // First try to load from Supabase
        const { data: supabaseTeam, error } = await supabase
          .from('teams')
          .select('name')
          .eq('id', teamId)
          .eq('quiz_id', quizConfig.id)
          .eq('user_id', user.id)
          .single();

        if (!error && supabaseTeam) {
          console.log('Team name loaded from Supabase:', supabaseTeam.name);
          setTeamName(supabaseTeam.name);
          return;
        }

        console.log('Team not found in Supabase, checking localStorage');
        
        // Fallback to localStorage with user-specific key
        const userSpecificKey = `teams-${quizConfig.id}-${user.id}`;
        const userTeams = localStorage.getItem(userSpecificKey);
        
        if (userTeams) {
          const teams: Team[] = JSON.parse(userTeams);
          const team = teams.find(t => t.id === teamId);
          if (team) {
            console.log('Team name loaded from user-specific localStorage:', team.name);
            setTeamName(team.name);
            return;
          }
        }
        
        // Final fallback to general teams
        const savedTeams = localStorage.getItem("quiz-teams");
        if (savedTeams) {
          const teams: Team[] = JSON.parse(savedTeams);
          const team = teams.find(t => t.id === teamId);
          if (team) {
            console.log('Team name loaded from general localStorage:', team.name);
            setTeamName(team.name);
          } else {
            console.log('Team not found in any storage');
          }
        }
      } catch (error) {
        console.error("Error loading team name:", error);
        setTeamName("");
      }
    };

    loadTeamName();
  }, [teamId, user, quizConfig?.id]);

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

  const currentQuestion = gameQuestions[currentQuestionIndex];
  
  const handleStartGame = () => {
    setGameStarted(true);
    
    // Use new centralized sound system
    soundManager.handleGameStart();
    soundManager.handleFastForwardStart();
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
    setLastAnswerCorrect(isCorrect);
    
    // Handle sound result using centralized system
    soundManager.handleAnswerResult(isCorrect, currentQuestionIndex);
    
    if (isCorrect) {
      const newCumulativePoints = cumulativePoints + currentQuestion.value;
      setCumulativePoints(newCumulativePoints);
      setMoneyWon(newCumulativePoints);
      
      setTimeout(() => {
        if (currentQuestionIndex === gameQuestions.length - 1) {
          setGameWon(true);
          setGameOver(true);
          soundManager.handleWin();
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
    setTimeUpCalled(false); // Reset for next question
    timeUpCalledRef.current = false; // Reset ref for next question
    timeUpProcessingRef.current = false; // Reset processing ref
    setLastAnswerCorrect(false); // Reset for next question
    
    if (gameOver) {
      setResultDialogOpen(true);
      return;
    }
    
    if (currentQuestionIndex < gameQuestions.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      
      // Handle question transition sounds
      soundManager.handleQuestionTransition(nextQuestionIndex);
      
      setRevealAnswer(false);
      setShowResult(false);
      setSelectedOption(null);
      setDisabledOptions([]);
      setTimerPaused(false);
    }
  };

  const handleTimeUp = () => {
    console.log('GameScreen.handleTimeUp called:', {
      timeUpCalled: timeUpCalledRef.current,
      processing: timeUpProcessingRef.current,
      gameOver
    });
    
    // Strongest protection against multiple calls
    if (timeUpCalledRef.current || timeUpProcessingRef.current || gameOver) {
      console.log('GameScreen.handleTimeUp: Prevented duplicate call');
      return;
    }
    
    // Set both refs immediately to prevent any race conditions
    timeUpCalledRef.current = true;
    timeUpProcessingRef.current = true;
    setTimeUpCalled(true);
    
    console.log('GameScreen.handleTimeUp: Processing time up event');
    
    setGameOver(true);
    soundManager.handleTimeUp();
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
    
    // Reset processing flag after a delay
    setTimeout(() => {
      timeUpProcessingRef.current = false;
    }, 1000);
  };

  const handleUseLifeline = (lifelineId: string, result: any) => {
    setLifelinesUsed({ ...lifelinesUsed, [lifelineId]: true });
    setTotalLifelinesUsedInGame(totalLifelinesUsedInGame + 1);
    
    // Use centralized sound system for lifeline
    soundManager.handleLifelineUsed();
    
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
    
    if (!user || !quizConfig?.id || !teamId) {
      console.error('Missing required data for team update:', {
        user: !!user,
        quizConfig: !!quizConfig?.id,
        teamId: !!teamId
      });
      toast({
        title: "Error",
        description: "Missing required data to save score",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const updatedTeam = {
        ...teamToUpdate,
        points: teamToUpdate.points + pointsToAdd,
        gamesPlayed: teamToUpdate.gamesPlayed + 1,
        totalLifelinesUsed: (teamToUpdate.totalLifelinesUsed || 0) + totalLifelinesUsedInGame
      };

      // Update in Supabase with proper validation
      console.log('Updating team in Supabase:', {
        teamId,
        quizId: quizConfig.id,
        userId: user.id,
        points: updatedTeam.points
      });

      const { data: updateResult, error } = await supabase
        .from('teams')
        .update({
          points: updatedTeam.points,
          games_played: updatedTeam.gamesPlayed,
          total_lifelines_used: updatedTeam.totalLifelinesUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .eq('quiz_id', quizConfig.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('No rows updated in Supabase');
        throw new Error('Team not found or update failed');
      }

      console.log('Team updated in Supabase successfully:', updateResult);
      toast({
        title: "Score Saved",
        description: `${pointsToAdd} points added to ${teamToUpdate.name}`,
      });

      // Update localStorage with user-specific key as backup
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
          console.log('Team data updated in localStorage and event dispatched');
        }
      }
    } catch (error) {
      console.error('Error updating team data:', error);
      
      // Fallback: save to localStorage only
      try {
        const userSpecificKey = `teams-${quizConfig.id}-${user.id}`;
        const savedTeams = localStorage.getItem(userSpecificKey);
        
        if (savedTeams) {
          const teams: Team[] = JSON.parse(savedTeams);
          const teamIndex = teams.findIndex(team => team.id === teamId);
          
          if (teamIndex !== -1) {
            teams[teamIndex] = {
              ...teamToUpdate,
              points: teamToUpdate.points + pointsToAdd,
              gamesPlayed: teamToUpdate.gamesPlayed + 1,
              totalLifelinesUsed: (teamToUpdate.totalLifelinesUsed || 0) + totalLifelinesUsedInGame
            };
            localStorage.setItem(userSpecificKey, JSON.stringify(teams));
            localStorage.setItem("quiz-teams", JSON.stringify(teams));
            
            toast({
              title: "Score Saved Locally",
              description: `${pointsToAdd} points saved locally for ${teamToUpdate.name}`,
            });
          }
        }
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to save game results",
          variant: "destructive"
        });
      }
    }
  };

  const handleGameEnd = async () => {
    setResultDialogOpen(false);
    setShowConfetti(false);
    
    soundManager.handleGameEnd();

    console.log('Game ending, saving points. TeamId:', teamId, 'Points:', cumulativePoints);

    // Update team data with proper validation
    if (teamId && user && quizConfig?.id && cumulativePoints > 0) {
      try {
        // Try to get team from Supabase first
        const { data: supabaseTeam, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .eq('quiz_id', quizConfig.id)
          .eq('user_id', user.id)
          .single();

        if (!error && supabaseTeam) {
          const team: Team = {
            id: supabaseTeam.id,
            name: supabaseTeam.name,
            points: supabaseTeam.points || 0,
            gamesPlayed: supabaseTeam.games_played || 0,
            bonusPoints: supabaseTeam.bonus_points || 0,
            totalLifelinesUsed: supabaseTeam.total_lifelines_used || 0
          };
          console.log('Found team in Supabase, updating:', team);
          await updateTeamData(team, cumulativePoints);
        } else {
          // Fallback to localStorage
          console.log('Team not found in Supabase, checking localStorage');
          const userSpecificKey = `teams-${quizConfig.id}-${user.id}`;
          const savedTeams = localStorage.getItem(userSpecificKey) || localStorage.getItem("quiz-teams");
          
          if (savedTeams) {
            const teams: Team[] = JSON.parse(savedTeams);
            const team = teams.find(t => t.id === teamId);
            if (team) {
              console.log('Found team in localStorage, updating:', team);
              await updateTeamData(team, cumulativePoints);
            } else {
              console.error('Team not found in any storage');
              toast({
                title: "Warning",
                description: "Could not find team to save score",
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error('Error finding team for update:', error);
        toast({
          title: "Error",
          description: "Failed to save game results",
          variant: "destructive"
        });
      }
    } else {
      console.log('Skipping score save - missing data or zero points:', {
        teamId: !!teamId,
        user: !!user,
        quizConfig: !!quizConfig?.id,
        points: cumulativePoints
      });
    }
    
    const gameResult: GameResult = {
      totalWon: cumulativePoints,
      questionLevel: currentQuestionIndex + 1,
      isWinner: gameWon,
      teamId
    };
    
    console.log('Calling onGameEnd with result:', gameResult);
    onGameEnd(gameResult);
    
    // Use navigate instead of window.location for proper React Router navigation
    navigate('/');
  };

  const handleWalkAway = () => {
    setGameOver(true);
    soundManager.handleWalkAway();
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
    
    // Use centralized sound system - pass questionIndex for proper logic
    soundManager.handleOptionSelected(currentQuestionIndex);
  };

  const toggleTimerPause = () => {
    if (!timerPaused) {
      soundManager.handlePause();
    } else {
      // Resume - pass current question index to determine if fast-forward should resume
      soundManager.handleResume(currentQuestionIndex);
    }
    setTimerPaused(!timerPaused);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    soundManager.setMuted(newMutedState);
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
      // No longer need to play final-answer here since it's handled by handleOptionSelected
      // Small delay before processing the answer
      setTimeout(() => {
        handleAnswer(selectedOption);
      }, 1000);
    }
  };

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
        settings={currentSettings}
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
              <span className="text-millionaire-gold font-bold mr-2 text-lg">Team:</span>
              <span className="text-white font-medium text-lg">{teamName}</span>
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
          {/* Mute Button */}
          <Button
            variant="outline"
            className="border-millionaire-accent text-millionaire-gold hover:bg-millionaire-accent flex items-center gap-1"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
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
              {/* Continue Button - always visible but disabled when not available */}
              <Button
                className={`${
                  isContinueAvailable 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                } flex items-center gap-2 transition-colors duration-200`}
                onClick={handleNextQuestion}
                disabled={!isContinueAvailable}
                title={isContinueAvailable ? "Continue to next question (Enter key)" : "Answer correctly to continue"}
              >
                <ArrowRight size={16} />
                Continue
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
                    Playing as: <span className="font-bold text-millionaire-gold">{teamName}</span>
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
              settings={currentSettings}
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
        <DialogContent className="bg-millionaire-primary border-millionaire-accent max-w-[90vw] max-h-[90vh] w-full h-full overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-millionaire-gold text-[40px] mb-4">{gameOver ? "Game Over" : "Correct!"}</DialogTitle>
            <DialogDescription className="text-millionaire-light text-xl whitespace-pre-line leading-relaxed text-center">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          
          {showExplanation && currentQuestion.explanation && (
            <div className="mt-8 p-8 bg-millionaire-secondary rounded-md text-center">
              <h3 className="font-bold text-millionaire-gold mb-4 text-5xl">Explanation:</h3>
              <p className="text-millionaire-light text-xl leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}
          
          <DialogFooter className="justify-center mt-8">
            <Button
              onClick={handleNextQuestion}
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary text-xl px-8 py-4"
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
