
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team } from "@/utils/gameUtils";
import QuizHeader from "@/components/home/QuizHeader";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";
import { UserMenu } from "@/components/auth/UserMenu";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quizHistory, loadQuizHistory } = useQuizHistory();
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const initializePage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

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
  }, [user, loadQuizHistory]);

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
        loadTeams();
      }
    }
  }, [currentQuizConfig, quizHistory, user]);

  const loadTeams = async () => {
    if (!currentQuizConfig || !user) return;

    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('quiz_id', currentQuizConfig.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading teams:', error);
        return;
      }

      const formattedTeams: Team[] = teamsData?.map(team => ({
        id: team.id,
        name: team.name,
        points: team.points || 0,
        bonusPoints: team.bonus_points || 0,
        gamesPlayed: team.games_played || 0,
        totalLifelinesUsed: team.total_lifelines_used || 0
      })) || [];

      setTeams(formattedTeams);
      
      // Also save to localStorage for compatibility
      localStorage.setItem("millionaire-teams", JSON.stringify(formattedTeams));
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const forceRefresh = async () => {
    if (!user) return;
    
    setLoading(true);
    await loadQuizHistory();
    await loadTeams();
    setLoading(false);
    
    toast({
      title: "Data Refreshed",
      description: "Quiz and team data has been updated from the database."
    });
  };

  const calculateTotalPoints = (team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0);
  };

  const handleBonusPointsChange = (teamId: string, value: string) => {
    const points = parseInt(value) || 0;
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, bonusPoints: points } : team
      )
    );
  };

  const saveBonusPoints = async (teamId: string) => {
    if (!user) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ bonus_points: team.bonusPoints || 0 })
        .eq('id', teamId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving bonus points:', error);
        toast({
          title: "Error",
          description: "Failed to save bonus points",
          variant: "destructive"
        });
        return;
      }

      // Update localStorage
      localStorage.setItem("millionaire-teams", JSON.stringify(teams));

      toast({
        title: "Success",
        description: "Bonus points saved successfully"
      });
    } catch (error) {
      console.error('Error saving bonus points:', error);
      toast({
        title: "Error",
        description: "Failed to save bonus points",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-millionaire-gold">Loading...</h1>
            <UserMenu />
          </div>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-millionaire-light">Loading your quiz data...</div>
          </div>
        </div>
      </div>
    );
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <QuizHeader currentQuizConfig={currentQuizConfig} forceRefresh={forceRefresh} />
          </div>
          <UserMenu />
        </div>
        
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
            handleBonusPointsChange={handleBonusPointsChange}
            saveBonusPoints={saveBonusPoints}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
