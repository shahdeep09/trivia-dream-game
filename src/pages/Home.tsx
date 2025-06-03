import { useState, useEffect } from "react";
import { Team } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trophy, Users, Settings, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";

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
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="bg-millionaire-secondary border-millionaire-accent max-w-md w-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-16 h-16 text-millionaire-accent mb-4" />
                <h2 className="text-xl font-semibold text-millionaire-gold mb-2">No Quiz Configured</h2>
                <p className="text-millionaire-light mb-6 text-center">
                  Please create or load a quiz configuration to start playing.
                </p>
                <div className="flex space-x-4">
                  <Button
                    asChild
                    className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                  >
                    <Link to="/setup">
                      <Plus size={16} className="mr-2" />
                      Create Quiz
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-millionaire-accent"
                  >
                    <Link to="/manager">
                      <Settings size={16} className="mr-2" />
                      Load Quiz
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold">{currentQuizConfig.samajName}</h1>
            <p className="text-millionaire-light mt-2">
              Quiz Competition - {currentQuizConfig.numberOfQuestions} Questions - Quiz ID: {currentQuizConfig.id?.slice(0, 8)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {currentQuizConfig.logo && (
              <img 
                src={currentQuizConfig.logo} 
                alt="Quiz Logo" 
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex space-x-2">
              <Button
                onClick={forceRefresh}
                variant="outline"
                className="border-millionaire-accent"
              >
                Refresh Data
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-millionaire-accent"
              >
                <Link to="/manager">
                  <Settings size={16} className="mr-2" />
                  Quiz Manager
                </Link>
              </Button>
              <Button
                asChild
                className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
              >
                <Link to="/game">Play Game</Link>
              </Button>
            </div>
          </div>
        </div>
        
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
          
          <TabsContent value="teams">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={`${team.id}-${refreshKey}`} className="bg-millionaire-secondary border-millionaire-accent">
                  <CardHeader>
                    <CardTitle className="text-millionaire-gold">{team.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p><span className="font-medium text-white">Game Points:</span> <span className="font-bold text-white">{team.points || 0}</span></p>
                        <p><span className="font-medium text-white">Bonus Points:</span> <span className="font-bold text-white">{team.bonusPoints || 0}</span></p>
                        <p><span className="font-medium text-millionaire-gold">Total Points:</span> <span className="font-bold text-millionaire-gold text-lg">{calculateTotalPoints(team)}</span></p>
                        <p><span className="font-medium text-white">Games Played:</span> <span className="font-bold text-white">{team.gamesPlayed || 0}</span></p>
                        <p><span className="font-medium text-white">Lifelines Used:</span> <span className="font-bold text-white">{team.totalLifelinesUsed || 0}</span></p>
                      </div>
                      <Button
                        asChild
                        className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                      >
                        <Link to={`/game?team=${team.id}&tab=upload`}>Play</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="points">
            <Card className="bg-millionaire-secondary border-millionaire-accent">
              <CardHeader>
                <CardTitle className="text-millionaire-gold text-center">Team Points Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-millionaire-primary">
                      <TableHead className="text-millionaire-gold">Rank</TableHead>
                      <TableHead className="text-millionaire-gold">Team</TableHead>
                      <TableHead className="text-millionaire-gold">Game Points</TableHead>
                      <TableHead className="text-millionaire-gold">Bonus Points</TableHead>
                      <TableHead className="text-millionaire-gold">Total Points</TableHead>
                      <TableHead className="text-millionaire-gold">Games Played</TableHead>
                      <TableHead className="text-millionaire-gold">Lifelines Used</TableHead>
                      <TableHead className="text-millionaire-gold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams
                      .sort((a, b) => calculateTotalPoints(b) - calculateTotalPoints(a))
                      .map((team, index) => (
                        <TableRow key={`${team.id}-${refreshKey}-table`} className="border-b border-millionaire-accent">
                          <TableCell className="font-medium text-white">{index + 1}</TableCell>
                          <TableCell className="font-medium text-white">{team.name}</TableCell>
                          <TableCell className="font-bold text-white text-lg">{team.points || 0}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              className="w-20 bg-millionaire-primary text-millionaire-gold border-millionaire-accent"
                              value={team.bonusPoints || 0}
                              onChange={(e) => handleBonusPointsChange(team.id, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-millionaire-gold text-xl">
                            {calculateTotalPoints(team)}
                          </TableCell>
                          <TableCell className="font-bold text-lg text-white">{team.gamesPlayed || 0}</TableCell>
                          <TableCell className="font-bold text-white text-lg">
                            {team.totalLifelinesUsed || 0}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
                              onClick={() => saveBonusPoints(team.id)}
                            >
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
