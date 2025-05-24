
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

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teamId = queryParams.get("team");
  const initialTab = queryParams.get("tab") || "manager";
  
  // Load saved questions from localStorage on initial render
  useEffect(() => {
    const savedQuestions = localStorage.getItem("millionaire-questions");
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      // Use sample questions if no saved questions found
      setQuestions(SAMPLE_QUESTIONS);
    }
    
    const savedSettings = localStorage.getItem("millionaire-settings");
    if (savedSettings) {
      setGameSettings(JSON.parse(savedSettings));
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
    setIsPlaying(true);
  };
  
  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setIsPlaying(false);
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
  
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      {isPlaying ? (
        <GameScreen
          questions={questions}
          settings={gameSettings}
          onGameEnd={handleGameEnd}
          onBackToAdmin={handleBackToAdmin}
          teamId={teamId}
        />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-millionaire-gold">Who Wants to Be a Millionaire</h1>
              <p className="text-millionaire-light mt-2">
                Question Manager {teamId ? `- Playing as Team ${teamId}` : ""}
              </p>
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
          
          <div className="mb-4 flex justify-end">
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
              <Label>Lifeline Names</Label>
              <Input
                value={gameSettings.lifelineNames.lifeline1}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    lifelineNames: {
                      ...gameSettings.lifelineNames,
                      lifeline1: e.target.value,
                    },
                  })
                }
                placeholder="Lifeline 1"
                className="mb-2 bg-millionaire-secondary"
              />
              <Input
                value={gameSettings.lifelineNames.lifeline2}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    lifelineNames: {
                      ...gameSettings.lifelineNames,
                      lifeline2: e.target.value,
                    },
                  })
                }
                placeholder="Lifeline 2"
                className="mb-2 bg-millionaire-secondary"
              />
              <Input
                value={gameSettings.lifelineNames.lifeline3}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    lifelineNames: {
                      ...gameSettings.lifelineNames,
                      lifeline3: e.target.value,
                    },
                  })
                }
                placeholder="Lifeline 3"
                className="bg-millionaire-secondary"
              />
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
