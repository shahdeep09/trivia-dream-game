
import { useState, useEffect } from "react";
import { Team } from "@/utils/gameUtils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import QuizHeader from "@/components/home/QuizHeader";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";

const Home = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Force refresh function
  const forceRefresh = () => {
    console.log('Force refreshing team data...');
    setRefreshKey(prev => prev + 1);
  };

  // Ensure quiz exists in Supabase before proceeding
  const ensureQuizExistsInSupabase = async (config: QuizConfig) => {
    try {
      // Check if quiz exists in Supabase
      const { data: existingQuiz, error: checkError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('id', config.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking quiz existence:', checkError);
        return false;
      }

      if (!existingQuiz) {
        // Quiz doesn't exist, create it
        console.log('Quiz not found in Supabase, creating it:', config.id);
        const { error: insertError } = await supabase
          .from('quizzes')
          .insert({
            id: config.id,
            samaj_name: config.samajName,
            number_of_questions: config.numberOfQuestions,
            number_of_teams: config.numberOfTeams,
            question_config: config.questionConfig,
            selected_lifelines: config.selectedLifelines,
            team_names: config.teamNames,
            logo: config.logo,
            created_at: config.createdAt
          });

        if (insertError) {
          console.error('Error creating quiz in Supabase:', insertError);
          return false;
        }
        
        console.log('Quiz created successfully in Supabase');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring quiz exists:', error);
      return false;
    }
  };

  // Load teams data from Supabase for current quiz ONLY
  const loadTeamsData = async () => {
    console.log('Loading teams data from Supabase...');
    
    // Load current quiz configuration
    const savedConfig = localStorage.getItem("current-quiz-config");
    if (!savedConfig) {
      setCurrentQuizConfig(null);
      setTeams([]);
      return;
    }

    const config: QuizConfig = JSON.parse(savedConfig);
    setCurrentQuizConfig(config);

    // Ensure quiz exists in Supabase first
    const quizExists = await ensureQuizExistsInSupabase(config);
    if (!quizExists) {
      toast({
        title: "Error",
        description: "Failed to ensure quiz exists in database. Using local data only.",
        variant: "destructive"
      });
      // Fallback to creating teams from config
      createTeamsFromConfig(config, false);
      return;
    }

    try {
      // Load teams from Supabase for this specific quiz ONLY
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('quiz_id', config.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading teams from Supabase:', error);
        // Fallback to creating teams from config if not exists
        createTeamsFromConfig(config, true);
      } else if (teamsData && teamsData.length > 0) {
        // Convert Supabase data to Team format
        const formattedTeams: Team[] = teamsData.map(team => ({
          id: team.id,
          name: team.name,
          points: team.points || 0,
          gamesPlayed: team.games_played || 0,
          bonusPoints: team.bonus_points || 0,
          totalLifelinesUsed: team.total_lifelines_used || 0
        }));
        
        console.log('Loaded teams from Supabase for quiz:', config.id, formattedTeams);
        setTeams(formattedTeams);
        
        // Also save to localStorage as backup with quiz isolation
        localStorage.setItem(`teams-${config.id}`, JSON.stringify(formattedTeams));
        localStorage.setItem("millionaire-teams", JSON.stringify(formattedTeams));
      } else {
        // No teams found, create them
        createTeamsFromConfig(config, true);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      // Fallback to creating from config
      createTeamsFromConfig(config, true);
    }
  };

  const createTeamsFromConfig = async (config: QuizConfig, saveToSupabase: boolean = true) => {
    console.log('Creating teams from config for quiz:', config.id);
    
    const configuredTeams: Team[] = config.teamNames.map((name, index) => ({
      id: crypto.randomUUID(),
      name: name,
      points: 0,
      gamesPlayed: 0,
      bonusPoints: 0,
      totalLifelinesUsed: 0
    }));
    
    if (saveToSupabase) {
      try {
        // Save teams to Supabase with quiz_id
        const teamsData = configuredTeams.map(team => ({
          id: team.id,
          quiz_id: config.id,
          name: team.name,
          points: team.points,
          games_played: team.gamesPlayed,
          bonus_points: team.bonusPoints,
          total_lifelines_used: team.totalLifelinesUsed
        }));

        const { error } = await supabase
          .from('teams')
          .insert(teamsData);

        if (error) {
          console.error('Error saving teams to Supabase:', error);
          toast({
            title: "Warning",
            description: "Teams created locally but failed to save to database",
            variant: "destructive"
          });
        } else {
          console.log('Teams saved to Supabase successfully for quiz:', config.id);
        }
      } catch (error) {
        console.error('Error creating teams in Supabase:', error);
      }
    }
    
    setTeams(configuredTeams);
    localStorage.setItem(`teams-${config.id}`, JSON.stringify(configuredTeams));
    localStorage.setItem("millionaire-teams", JSON.stringify(configuredTeams));
  };

  // Initial load
  useEffect(() => {
    loadTeamsData();
  }, [refreshKey]);

  // Enhanced team data refresh with quiz isolation
  useEffect(() => {
    const handleTeamUpdate = (event?: CustomEvent) => {
      const detail = event?.detail;
      console.log('Team data update event received:', detail);
      
      // Only refresh if the update is for the current quiz
      if (detail?.quizId && currentQuizConfig?.id && detail.quizId === currentQuizConfig.id) {
        setTimeout(() => {
          loadTeamsData();
          forceRefresh();
        }, 100);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'millionaire-teams' || (currentQuizConfig && e.key === `teams-${currentQuizConfig.id}`)) {
        console.log('Storage change detected for teams:', e.newValue);
        setTimeout(() => {
          loadTeamsData();
          forceRefresh();
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible, refreshing team data...');
        loadTeamsData();
        forceRefresh();
      }
    };

    const handleFocus = () => {
      console.log('Window focused, refreshing team data...');
      loadTeamsData();
      forceRefresh();
    };

    // Add multiple event listeners for better data synchronization
    window.addEventListener('teamDataUpdated', handleTeamUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Also add a periodic refresh to catch any missed updates
    const intervalId = setInterval(() => {
      loadTeamsData();
    }, 5000);
    
    return () => {
      window.removeEventListener('teamDataUpdated', handleTeamUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [currentQuizConfig]);
  
  // Handle bonus points change
  const handleBonusPointsChange = (teamId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, bonusPoints: numValue } : team
      )
    );
  };

  // Calculate total points (game points + bonus points)
  const calculateTotalPoints = (team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0);
  };

  // Save bonus points for a team
  const saveBonusPoints = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !currentQuizConfig) return;

    try {
      // Update in Supabase for current quiz only
      const { error } = await supabase
        .from('teams')
        .update({ 
          bonus_points: team.bonusPoints,
          points: team.points,
          games_played: team.gamesPlayed,
          total_lifelines_used: team.totalLifelinesUsed
        })
        .eq('id', teamId)
        .eq('quiz_id', currentQuizConfig.id);

      if (error) {
        console.error('Error updating team in Supabase:', error);
        toast({
          title: "Error",
          description: "Failed to save bonus points to database",
          variant: "destructive"
        });
      } else {
        console.log('Team updated in Supabase successfully for quiz:', currentQuizConfig.id);
        toast({
          title: "Bonus Points Saved",
          description: "The bonus points have been updated for this team.",
        });
      }
    } catch (error) {
      console.error('Error saving team data:', error);
      toast({
        title: "Error",
        description: "Failed to save bonus points",
        variant: "destructive"
      });
    }
    
    // Save the updated teams to localStorage with quiz isolation
    localStorage.setItem(`teams-${currentQuizConfig.id}`, JSON.stringify(teams));
    localStorage.setItem("millionaire-teams", JSON.stringify(teams));
    
    // Force refresh to ensure data consistency
    setTimeout(() => {
      forceRefresh();
    }, 100);
  };

  if (!currentQuizConfig) {
    return <NoQuizConfigured />;
  }
  
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <QuizHeader 
          currentQuizConfig={currentQuizConfig} 
          forceRefresh={forceRefresh} 
        />
        
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users size={16} />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Trophy size={16} />
              <span>Points Table</span>
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
