import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import GameScreen, { GameResult } from "@/components/GameScreen";
import QuestionManager from "@/components/QuestionManager";
import CSVUploader from "@/components/CSVUploader";
import { Question, GameSettings, DEFAULT_GAME_SETTINGS } from "@/utils/gameUtils";
import { SAMPLE_QUESTIONS } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { QuizConfig } from "./QuizSetup";

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teamId = queryParams.get("team");
  const initialTab = queryParams.get("tab") || "manager";
  
  // Load saved questions and quiz config on initial render
  useEffect(() => {
    // Load quiz configuration
    const savedConfig = localStorage.getItem("current-quiz-config");
    if (savedConfig) {
      const config: QuizConfig = JSON.parse(savedConfig);
      setCurrentQuizConfig(config);
      
      // Update game settings based on quiz config
      const updatedSettings = {
        ...gameSettings,
        lifelineNames: {
          lifeline1: config.selectedLifelines.includes("fifty-fifty") ? "50:50" : "",
          lifeline2: config.selectedLifelines.includes("audience-poll") ? "Audience Poll" : 
                     config.selectedLifelines.includes("ask-expert") ? "Ask The Expert" : "",
          lifeline3: config.selectedLifelines.includes("roll-dice") ? "Roll the Dice" : ""
        }
      };
      setGameSettings(updatedSettings);
    }
    
    const savedQuestions = localStorage.getItem("millionaire-questions");
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      // Use sample questions if no saved questions found
      setQuestions(SAMPLE_QUESTIONS);
    }
    
    const savedSettings = localStorage.getItem("millionaire-settings");
    if (savedSettings) {
      const loadedSettings = JSON.parse(savedSettings);
      setGameSettings(prev => ({ ...prev, ...loadedSettings }));
    }
  }, []);
  
  // Save questions to localStorage whenever they change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("millionaire-questions", JSON.stringify(questions));
    }
  }, [questions]);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("millionaire-settings", JSON.stringify(gameSettings));
  }, [gameSettings]);
  
  const handleAddQuestion = (question: Question) => {
    setQuestions([...questions, question]);
  };
  
  const handleUpdateQuestion = (updatedQuestion: Question) => {
    const updatedQuestions = questions.map(q =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
  };
  
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  const handleStartGame = () => {
    if (!currentQuizConfig) {
      navigate("/setup");
      return;
    }
    
    const limitedQuestions = questions.slice(0, currentQuizConfig.numberOfQuestions);
    if (limitedQuestions.length < currentQuizConfig.numberOfQuestions) {
      alert(`You need at least ${currentQuizConfig.numberOfQuestions} questions to start the game. You currently have ${questions.length}.`);
      return;
    }
    
    // Clear any previous game results to start fresh
    setGameResult(null);
    setIsPlaying(true);
  };
  
  const handleGameEnd = (result: GameResult) => {
    console.log('Game ended with result:', result);
    setGameResult(result);
    setIsPlaying(false);
    
    // Force re-render of team data by triggering a state update
    if (result.teamId) {
      // Trigger a re-render by updating a dummy state or forcing component refresh
      const event = new CustomEvent('teamDataUpdated');
      window.dispatchEvent(event);
    }
  };
  
  const handleBackToAdmin = () => {
    setIsPlaying(false);
  };
  
  const handleUpdateSettings = () => {
    setSettingsOpen(false);
  };
  
  const handleResetQuestions = () => {
    if (confirm("Are you sure you want to reset all questions to default samples?")) {
      setQuestions(SAMPLE_QUESTIONS);
    }
  };

  const handleQuestionsImported = (importedQuestions: Question[]) => {
    // Replace current questions with imported ones
    setQuestions(importedQuestions);
  };

  if (!currentQuizConfig) {
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-millionaire-gold mb-4">No Quiz Configuration Found</h1>
              <p className="text-millionaire-light mb-6">Please create or load a quiz configuration to start playing.</p>
              <div className="flex justify-center space-x-4">
                <Button
                  asChild
                  className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                >
                  <Link to="/setup">Create Quiz</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-millionaire-accent"
                >
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      {isPlaying ? (
        <GameScreen
          questions={questions.slice(0, currentQuizConfig.numberOfQuestions)}
          settings={gameSettings}
          onGameEnd={handleGameEnd}
          onBackToAdmin={handleBackToAdmin}
          teamId={teamId}
          quizConfig={currentQuizConfig}
        />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              {currentQuizConfig.logo && (
                <img 
                  src={currentQuizConfig.logo} 
                  alt="Quiz Logo" 
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold text-millionaire-gold">{currentQuizConfig.samajName}</h1>
                <p className="text-millionaire-light mt-2">
                  Question Manager {teamId ? `- Playing as Team ${teamId}` : ""}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                asChild
                variant="outline"
                className="border-millionaire-accent flex items-center gap-2"
              >
                <Link to="/">
                  <ArrowLeft size={16} />
                  Back to Teams
                </Link>
              </Button>
              <Button
                onClick={() => setSettingsOpen(true)}
                variant="outline"
                className="border-millionaire-accent"
              >
                Game Settings
              </Button>
            </div>
          </div>
          
          {/* Game result display */}
          {gameResult && (
            <div className="bg-millionaire-secondary p-4 rounded-lg mb-8 border border-millionaire-accent">
              <h2 className="text-xl font-bold mb-2">Last Game Result</h2>
              <p>
                {gameResult.isWinner
                  ? "Congratulations! You won the million points!"
                  : `You reached question #${gameResult.questionLevel} and won ${new Intl.NumberFormat("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 0,
                    }).format(gameResult.totalWon)} points`}
              </p>
            </div>
          )}
          
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-millionaire-light">
              Quiz Configuration: {currentQuizConfig.numberOfQuestions} questions, {currentQuizConfig.numberOfTeams} teams
            </div>
            <Button
              onClick={handleResetQuestions}
              variant="outline"
              className="border-millionaire-wrong text-millionaire-wrong hover:bg-millionaire-wrong hover:text-white"
            >
              Reset to Sample Questions
            </Button>
          </div>
          
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manager">Question Manager</TabsTrigger>
              <TabsTrigger value="upload">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manager">
              <QuestionManager
                questions={questions}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onStartGame={handleStartGame}
                maxQuestions={currentQuizConfig.numberOfQuestions}
              />
            </TabsContent>
            
            <TabsContent value="upload">
              <div className="w-full max-w-4xl mx-auto">
                <CSVUploader onQuestionsImported={handleQuestionsImported} />
                
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleStartGame}
                    className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary px-8 py-6 text-xl"
                  >
                    Start Game
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-millionaire-primary border-millionaire-accent">
          <DialogHeader>
            <DialogTitle>Game Settings</DialogTitle>
            <DialogDescription>Customize your game experience</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timer">Time per question (seconds)</Label>
              <Input
                id="timer"
                type="number"
                min="10"
                max="120"
                value={gameSettings.timePerQuestion}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    timePerQuestion: parseInt(e.target.value) || 30,
                  })
                }
                className="bg-millionaire-secondary"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sound-effects"
                checked={gameSettings.soundEffects}
                onCheckedChange={(checked) =>
                  setGameSettings({
                    ...gameSettings,
                    soundEffects: checked,
                  })
                }
              />
              <Label htmlFor="sound-effects">Enable sound effects</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Available Lifelines (from Quiz Configuration)</Label>
              <div className="text-sm text-millionaire-light">
                {currentQuizConfig?.selectedLifelines.map(lifeline => (
                  <div key={lifeline} className="capitalize">{lifeline.replace('-', ' ')}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleUpdateSettings}
              className="bg-millionaire-accent hover:bg-millionaire-secondary"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
