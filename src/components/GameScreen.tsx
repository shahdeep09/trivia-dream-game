import { useState, useEffect } from "react";
import { Question as QuestionType, Team, GameAction, GameSettings } from "@/utils/game/types";
import { DEFAULT_GAME_SETTINGS } from "@/utils/game/constants";
import { formatMoney, shuffleOptions } from "@/utils/game/questionUtils";
import { soundManager } from "@/utils/sound/RefactoredSoundManager";
import Question from "./Question";
import MoneyLadder from "./MoneyLadder";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Import the new smaller components
import GameHeader from "./game/GameHeader";
import GameInfo from "./game/GameInfo";
import GameControls from "./game/GameControls";
import GameLifelines from "./game/GameLifelines";
import GameDialogs from "./game/GameDialogs";
import GameStartScreen from "./game/GameStartScreen";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  const { user } = useAuth();
  
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
    setGameOver(true);
    soundManager.handleGameEnd();
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
    
    if (!user || !quizConfig?.id) {
      console.error('No authenticated user or quiz config found');
      toast({
        title: "Error",
        description: "User not authenticated or no quiz configuration",
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

      // Update in Supabase with proper user isolation
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
          console.log('Team data updated in localStorage and event dispatched');
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

  const handleGameEnd = async () => {
    setResultDialogOpen(false);
    setShowConfetti(false);
    
    soundManager.handleGameEnd();

    console.log('Game ending, saving points. TeamId:', teamId, 'Points:', cumulativePoints);

    // Update team data with the new function
    if (teamId && user && quizConfig?.id) {
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
            }
          }
        }
      } catch (error) {
        console.error('Error finding team for update:', error);
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
    
    // Use centralized sound system
    soundManager.handleOptionSelected();
  };

  const toggleTimerPause = () => {
    if (!timerPaused) {
      soundManager.handlePause();
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
      // Use centralized sound system with question index for proper logic
      soundManager.handleFinalAnswerClicked(currentQuestionIndex);
      
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
      <GameHeader quizConfig={quizConfig} />
      
      {/* Control bar */}
      <div className="flex justify-between items-center p-4 bg-millionaire-primary border-b border-millionaire-accent">
        <GameInfo teamName={teamName} cumulativePoints={cumulativePoints} />

        {/* Lifelines */}
        <GameLifelines
          quizConfig={quizConfig}
          lifelinesUsed={lifelinesUsed}
          currentQuestion={currentQuestion}
          settings={currentSettings}
          onUseLifeline={handleUseLifeline}
        />
        
        <GameControls
          gameStarted={gameStarted}
          isMuted={isMuted}
          selectedOption={selectedOption}
          revealAnswer={revealAnswer}
          gameOver={gameOver}
          timerPaused={timerPaused}
          actionHistory={actionHistory}
          onStartGame={handleStartGame}
          onToggleMute={toggleMute}
          onUndo={handleUndo}
          onFinalAnswer={handleFinalAnswer}
          onToggleTimerPause={toggleTimerPause}
          onWalkAway={handleWalkAway}
        />
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
            <GameStartScreen teamName={teamName} />
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
      
      {/* Game Dialogs */}
      <GameDialogs
        dialogOpen={dialogOpen}
        resultDialogOpen={resultDialogOpen}
        gameOver={gameOver}
        gameWon={gameWon}
        dialogMessage={dialogMessage}
        showExplanation={showExplanation}
        currentQuestion={currentQuestion}
        cumulativePoints={cumulativePoints}
        currentQuestionIndex={currentQuestionIndex}
        onDialogOpenChange={setDialogOpen}
        onResultDialogOpenChange={setResultDialogOpen}
        onNextQuestion={handleNextQuestion}
        onGameEnd={handleGameEnd}
      />
    </div>
  );
};

export default GameScreen;
