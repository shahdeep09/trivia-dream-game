
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizHeader from "@/components/home/QuizHeader";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import { UserMenu } from "@/components/auth/UserMenu";
import { useNavigate } from "react-router-dom";
import { QuizConfig } from "@/types/quiz";
import { Team } from "@/utils/gameUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Home = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load quiz data and initialize teams based on quiz configuration
  useEffect(() => {
    const loadQuizData = async () => {
      if (!user) {
        console.log('No user logged in, clearing data');
        setCurrentQuizConfig(null);
        setTeams([]);
        return;
      }

      try {
        const quizConfig = localStorage.getItem("current-quiz-config");
        if (quizConfig) {
          const config = JSON.parse(quizConfig);
          console.log('Loading quiz config:', config);
          setCurrentQuizConfig(config);
          
          // Initialize teams based on quiz configuration for current user
          await initializeTeamsFromConfig(config);
        } else {
          console.log('No quiz config found');
          setCurrentQuizConfig(null);
          setTeams([]);
        }
      } catch (error) {
        console.error("Error loading quiz data:", error);
      }
    };

    loadQuizData();
  }, [refreshKey, user]);

  // Listen for team data updates from the game screen
  useEffect(() => {
    const handleTeamDataUpdate = async (event: CustomEvent) => {
      console.log('Team data update event received:', event.detail);
      const { quizId, userId } = event.detail;
      
      // Only refresh if it's for the current user and quiz
      if (user?.id === userId && currentQuizConfig?.id === quizId) {
        console.log('Refreshing teams due to update event');
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('teamDataUpdated', handleTeamDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('teamDataUpdated', handleTeamDataUpdate as EventListener);
    };
  }, [user?.id, currentQuizConfig?.id]);

  // Initialize teams from quiz configuration for current user only
  const initializeTeamsFromConfig = async (config: QuizConfig) => {
    if (!user) {
      console.log('No user, cannot initialize teams');
      return;
    }

    try {
      let loadedTeams: Team[] = [];

      // Try to load from Supabase for current user and quiz
      if (config.id) {
        console.log('Loading teams from Supabase for user:', user.id, 'quiz:', config.id);
        const { data: supabaseTeams, error } = await supabase
          .from('teams')
          .select('*')
          .eq('quiz_id', config.id)
          .eq('user_id', user.id);

        if (!error && supabaseTeams && supabaseTeams.length > 0) {
          console.log('Found teams in Supabase:', supabaseTeams);
          // Convert Supabase data to Team format
          loadedTeams = supabaseTeams.map(team => ({
            id: team.id,
            name: team.name,
            points: team.points || 0,
            gamesPlayed: team.games_played || 0,
            bonusPoints: team.bonus_points || 0,
            totalLifelinesUsed: team.total_lifelines_used || 0
          }));
        } else {
          console.log('No teams found in Supabase, creating from config');
          // Create teams from quiz config
          loadedTeams = await createTeamsFromConfig(config);
        }
      } else {
        console.log('No quiz ID, creating teams from config');
        loadedTeams = await createTeamsFromConfig(config);
      }

      setTeams(loadedTeams);
      console.log('Teams loaded:', loadedTeams);
    } catch (error) {
      console.error("Error initializing teams:", error);
      // Fallback to creating teams from config
      const fallbackTeams = await createTeamsFromConfig(config);
      setTeams(fallbackTeams);
    }
  };

  // Create teams from quiz configuration for current user
  const createTeamsFromConfig = async (config: QuizConfig): Promise<Team[]> => {
    if (!user) {
      console.log('No user, cannot create teams');
      return [];
    }

    const newTeams = config.teamNames.map((name, index) => ({
      id: crypto.randomUUID(),
      name: name,
      points: 0,
      gamesPlayed: 0,
      bonusPoints: 0,
      totalLifelinesUsed: 0
    }));

    console.log('Creating new teams:', newTeams);

    // Save to Supabase if user is authenticated and quiz exists
    if (config.id) {
      try {
        // First check if quiz exists in Supabase
        const { data: quizExists } = await supabase
          .from('quizzes')
          .select('id')
          .eq('id', config.id)
          .eq('user_id', user.id)
          .single();

        if (quizExists) {
          const teamsData = newTeams.map(team => ({
            id: team.id,
            quiz_id: config.id,
            user_id: user.id,
            name: team.name,
            points: team.points,
            games_played: team.gamesPlayed,
            bonus_points: team.bonusPoints,
            total_lifelines_used: team.totalLifelinesUsed
          }));

          const { error } = await supabase
            .from('teams')
            .upsert(teamsData);

          if (error) {
            console.error('Error saving teams to Supabase:', error);
          } else {
            console.log('Teams saved to Supabase successfully');
          }
        } else {
          console.log('Quiz not found in Supabase, saving only to localStorage');
        }
      } catch (error) {
        console.error('Error creating teams in Supabase:', error);
      }
    }

    // Also save to localStorage as backup with user-specific key
    const userSpecificKey = `teams-${config.id}-${user.id}`;
    localStorage.setItem(userSpecificKey, JSON.stringify(newTeams));
    
    // Update the general quiz-teams for backward compatibility
    localStorage.setItem("quiz-teams", JSON.stringify(newTeams));

    return newTeams;
  };

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const calculateTotalPoints = (team: Team): number => {
    return (team.points || 0) + (team.bonusPoints || 0);
  };

  const handleBonusPointsChange = (teamId: string, value: string) => {
    const updatedTeams = teams.map(team => 
      team.id === teamId 
        ? { ...team, bonusPoints: parseInt(value) || 0 }
        : team
    );
    setTeams(updatedTeams);
  };

  const saveBonusPoints = async (teamId: string) => {
    if (!user || !currentQuizConfig) {
      toast({
        title: "Error",
        description: "User not authenticated or no quiz configuration",
        variant: "destructive"
      });
      return;
    }

    try {
      const teamToUpdate = teams.find(team => team.id === teamId);
      if (!teamToUpdate) return;

      console.log('Saving bonus points for team:', teamToUpdate.name, 'points:', teamToUpdate.bonusPoints);

      // Save to Supabase if quiz ID exists
      if (currentQuizConfig.id) {
        const { error } = await supabase
          .from('teams')
          .update({
            bonus_points: teamToUpdate.bonusPoints || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId)
          .eq('quiz_id', currentQuizConfig.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating bonus points in Supabase:', error);
          toast({
            title: "Error",
            description: "Failed to save bonus points to database",
            variant: "destructive"
          });
          return;
        } else {
          console.log('Bonus points saved to Supabase successfully');
        }
      }

      // Update localStorage with user-specific key
      const userSpecificKey = `teams-${currentQuizConfig.id}-${user.id}`;
      localStorage.setItem(userSpecificKey, JSON.stringify(teams));
      localStorage.setItem("quiz-teams", JSON.stringify(teams));
      
      toast({
        title: "Success",
        description: `Bonus points saved for ${teamToUpdate.name}`,
      });
      
      forceRefresh();
    } catch (error) {
      console.error('Error saving bonus points:', error);
      toast({
        title: "Error",
        description: "Failed to save bonus points",
        variant: "destructive"
      });
    }
  };

  if (!currentQuizConfig) {
    return <NoQuizConfigured />;
  }

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold mb-2">
              Quiz Master Dashboard
            </h1>
            <p className="text-millionaire-light">
              Manage your quiz game and track team progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
            <Button
              onClick={() => navigate("/setup")}
              className="bg-millionaire-accent hover:bg-millionaire-accent/90"
            >
              Create New Quiz
            </Button>
          </div>
        </div>

        <QuizHeader 
          currentQuizConfig={currentQuizConfig}
          forceRefresh={forceRefresh}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-millionaire-dark border border-millionaire-accent">
            <TabsTrigger 
              value="teams"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="points"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Points Table
            </TabsTrigger>
          </TabsList>

          <TeamsTab 
            teams={teams}
            refreshKey={refreshKey}
            calculateTotalPoints={calculateTotalPoints}
          />

          <PointsTable 
            teams={teams}
            refreshKey={refreshKey}
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
