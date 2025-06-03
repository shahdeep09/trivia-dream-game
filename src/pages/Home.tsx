
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizHeader from "@/components/home/QuizHeader";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import { UserMenu } from "@/components/auth/UserMenu";
import { useQuizConfig } from "@/hooks/useQuizConfig";
import { useNavigate } from "react-router-dom";
import { QuizConfig } from "@/types/quiz";
import { Team, saveTeams } from "@/utils/gameUtils";
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
      try {
        const quizConfig = localStorage.getItem("current-quiz-config");
        if (quizConfig) {
          const config = JSON.parse(quizConfig);
          setCurrentQuizConfig(config);
          
          // Initialize teams based on quiz configuration
          await initializeTeamsFromConfig(config);
        }
      } catch (error) {
        console.error("Error loading quiz data:", error);
      }
    };

    loadQuizData();
  }, [refreshKey, user]);

  // Initialize teams from quiz configuration
  const initializeTeamsFromConfig = async (config: QuizConfig) => {
    try {
      let loadedTeams: Team[] = [];

      // First try to load from Supabase if user is authenticated
      if (user && config.id) {
        const { data: supabaseTeams, error } = await supabase
          .from('teams')
          .select('*')
          .eq('quiz_id', config.id)
          .eq('user_id', user.id);

        if (!error && supabaseTeams && supabaseTeams.length > 0) {
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
          // Create teams from quiz config if not found in Supabase
          loadedTeams = await createTeamsFromConfig(config);
        }
      } else {
        // Fallback to localStorage or create from config
        const savedTeams = localStorage.getItem(`teams-${config.id}`);
        if (savedTeams) {
          loadedTeams = JSON.parse(savedTeams);
        } else {
          loadedTeams = await createTeamsFromConfig(config);
        }
      }

      setTeams(loadedTeams);
    } catch (error) {
      console.error("Error initializing teams:", error);
      // Fallback to creating teams from config
      const fallbackTeams = await createTeamsFromConfig(config);
      setTeams(fallbackTeams);
    }
  };

  // Create teams from quiz configuration
  const createTeamsFromConfig = async (config: QuizConfig): Promise<Team[]> => {
    const newTeams = config.teamNames.map((name, index) => ({
      id: crypto.randomUUID(),
      name: name,
      points: 0,
      gamesPlayed: 0,
      bonusPoints: 0,
      totalLifelinesUsed: 0
    }));

    // Save to Supabase if user is authenticated
    if (user && config.id) {
      try {
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
        }
      } catch (error) {
        console.error('Error creating teams in Supabase:', error);
      }
    }

    // Also save to localStorage as backup
    localStorage.setItem(`teams-${config.id}`, JSON.stringify(newTeams));
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
    try {
      const teamToUpdate = teams.find(team => team.id === teamId);
      if (!teamToUpdate || !currentQuizConfig) return;

      // Save to Supabase if user is authenticated
      if (user && currentQuizConfig.id) {
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
        }
      }

      // Update localStorage as backup
      localStorage.setItem(`teams-${currentQuizConfig.id}`, JSON.stringify(teams));
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

          <TabsContent value="teams">
            <TeamsTab 
              teams={teams}
              refreshKey={refreshKey}
              calculateTotalPoints={calculateTotalPoints}
            />
          </TabsContent>

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
