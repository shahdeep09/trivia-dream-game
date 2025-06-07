
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import LoadingState from "@/components/home/LoadingState";
import HomeHeader from "@/components/home/HomeHeader";
import { UserMenu } from "@/components/auth/UserMenu";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quizHistory, loadQuizHistory } = useQuizHistory();
  const { createUserProfile } = useUserProfile();
  const {
    teams,
    loadTeams,
    calculateTotalPoints,
    updateTeamBonusPoints,
    saveBonusPoints
  } = useTeamManagement();
  
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Create user profile if needed
      await createUserProfile();

      // Load user's quiz history
      await loadQuizHistory();
      
      // Check for current quiz config in localStorage
      const savedConfig = localStorage.getItem("current-quiz-config");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setCurrentQuizConfig(config);
        } catch (error) {
          console.error("Error parsing saved quiz config:", error);
          localStorage.removeItem("current-quiz-config");
        }
      }
      
      setLoading(false);
    };

    initializePage();
  }, [user, loadQuizHistory, createUserProfile]);

  // Verify the current quiz belongs to the user once quiz history is loaded
  useEffect(() => {
    if (currentQuizConfig && quizHistory.length > 0 && user) {
      const userOwnsQuiz = quizHistory.some(quiz => quiz.id === currentQuizConfig.id);
      
      if (!userOwnsQuiz) {
        // This quiz doesn't belong to the current user, clear it
        localStorage.removeItem("current-quiz-config");
        localStorage.removeItem("millionaire-teams");
        setCurrentQuizConfig(null);
        
        toast({
          title: "Quiz Access Denied",
          description: "You can only access quizzes that you have created.",
          variant: "destructive"
        });
      } else {
        // Load teams for this quiz
        loadTeams(currentQuizConfig);
      }
    }
  }, [currentQuizConfig, quizHistory, user, loadTeams]);

  const forceRefresh = useCallback(async () => {
    if (!user || !currentQuizConfig) return;
    
    setLoading(true);
    await loadQuizHistory();
    await loadTeams(currentQuizConfig);
    setLoading(false);
    
    toast({
      title: "Data Refreshed",
      description: "Quiz and team data has been updated from the database."
    });
  }, [user, loadQuizHistory, loadTeams, currentQuizConfig]);

  if (loading) {
    return <LoadingState />;
  }

  // Show NoQuizConfigured if user has no quizzes or no current quiz is selected
  if (!currentQuizConfig || quizHistory.length === 0) {
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-millionaire-gold">Quiz Master</h1>
            <UserMenu />
          </div>
          <NoQuizConfigured />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <HomeHeader 
          currentQuizConfig={currentQuizConfig}
          forceRefresh={forceRefresh}
        />
        
        <div className="text-center mb-8">
          <p className="text-millionaire-light mb-4">
            Your quiz is ready! You can manage teams, view statistics, or start playing the game.
          </p>
        </div>

        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-millionaire-secondary">
            <TabsTrigger value="teams" className="data-[state=active]:bg-millionaire-primary data-[state=active]:text-millionaire-gold">
              Teams ({teams.length})
            </TabsTrigger>
            <TabsTrigger value="points" className="data-[state=active]:bg-millionaire-primary data-[state=active]:text-millionaire-gold">
              Points Table
            </TabsTrigger>
          </TabsList>

          <TeamsTab 
            teams={teams} 
            calculateTotalPoints={calculateTotalPoints}
          />

          <PointsTable 
            teams={teams}
            calculateTotalPoints={calculateTotalPoints}
            updateTeamBonusPoints={updateTeamBonusPoints}
            saveBonusPoints={saveBonusPoints}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
