import { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quizHistory, loadQuizHistory } = useQuizHistory();
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);

  const loadTeams = useCallback(async () => {
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
  }, [currentQuizConfig, user]);

  // Create user profile if it doesn't exist
  const createUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User'
          });

        if (error) {
          console.error('Error creating user profile:', error);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  }, [user]);

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
        loadTeams();
      }
    }
  }, [currentQuizConfig, quizHistory, user, loadTeams]);

  const forceRefresh = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    await loadQuizHistory();
    await loadTeams();
    setLoading(false);
    
    toast({
      title: "Data Refreshed",
      description: "Quiz and team data has been updated from the database."
    });
  }, [user, loadQuizHistory, loadTeams]);

  const calculateTotalPoints = useCallback((team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0);
  }, []);

  const handleBonusPointsChange = useCallback((teamId: string, value: string) => {
    const points = parseInt(value) || 0;
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, bonusPoints: points } : team
      )
    );
  }, []);

  const saveBonusPoints = useCallback(async (teamId: string) => {
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
  }, [user, teams]);

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
          <div className="flex items-center space-x-4">
            {currentQuizConfig.logo && (
              <img 
                src={currentQuizConfig.logo} 
                alt="Quiz Logo" 
                className="w-16 h-16 object-cover rounded-full border-2 border-millionaire-gold"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-millionaire-gold">{currentQuizConfig.samajName}</h1>
              <p className="text-millionaire-light mt-2">
                Quiz Competition - {currentQuizConfig.numberOfQuestions} Questions - Quiz ID: {currentQuizConfig.id?.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={forceRefresh}
              variant="outline"
              size="sm"
              className="border-millionaire-accent hover:bg-millionaire-accent text-white h-9"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Data
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-millionaire-accent hover:bg-millionaire-accent text-white h-9"
            >
              <Link to="/manager">
                <Settings size={16} className="mr-2" />
                Quiz Manager
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary font-semibold h-9"
            >
              <Link to="/game">
                <Play size={16} className="mr-2" />
                Play Game
              </Link>
            </Button>
            <UserMenu />
          </div>
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
