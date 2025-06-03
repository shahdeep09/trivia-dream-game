
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
import { QuizConfig } from "./QuizSetup";

const Home = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    // Load current quiz configuration
    const savedConfig = localStorage.getItem("current-quiz-config");
    if (savedConfig) {
      const config: QuizConfig = JSON.parse(savedConfig);
      setCurrentQuizConfig(config);
      
      // Generate teams based on quiz configuration
      const configuredTeams: Team[] = config.teamNames.map((name, index) => ({
        id: (index + 1).toString(),
        name: name,
        points: 0,
        gamesPlayed: 0,
        bonusPoints: 0,
        totalLifelinesUsed: 0
      }));
      
      setTeams(configuredTeams);
      
      // Save teams to localStorage
      localStorage.setItem("millionaire-teams", JSON.stringify(configuredTeams));
    } else {
      // Load teams from localStorage if no quiz config
      const savedTeams = localStorage.getItem("millionaire-teams");
      if (savedTeams) {
        const loadedTeams: Team[] = JSON.parse(savedTeams);
        const teamsWithLifelines = loadedTeams.map(team => ({
          ...team,
          bonusPoints: team.bonusPoints || 0,
          totalLifelinesUsed: team.totalLifelinesUsed || 0
        }));
        setTeams(teamsWithLifelines);
      }
    }
  }, [refreshKey]);

  // Enhanced team data refresh with multiple event listeners
  useEffect(() => {
    const handleTeamUpdate = (event?: CustomEvent) => {
      console.log('Team data update event received, refreshing...', event?.detail);
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'millionaire-teams') {
        console.log('Storage change detected, refreshing team data...');
        setTimeout(() => {
          setRefreshKey(prev => prev + 1);
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible, refreshing team data...');
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('teamDataUpdated', handleTeamUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('teamDataUpdated', handleTeamUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Save teams to localStorage whenever they change and force refresh
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem("millionaire-teams", JSON.stringify(teams));
      // Force a small delay to ensure UI updates
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 50);
    }
  }, [teams]);

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
    return team.points + (team.bonusPoints || 0);
  };

  // Save bonus points for a team
  const saveBonusPoints = (teamId: string) => {
    toast({
      title: "Bonus Points Saved",
      description: "The bonus points have been updated for this team.",
    });
    
    // Force refresh to ensure data consistency
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
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
              Quiz Competition - {currentQuizConfig.numberOfQuestions} Questions
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
                <Card key={team.id} className="bg-millionaire-secondary border-millionaire-accent">
                  <CardHeader>
                    <CardTitle className="text-millionaire-gold">{team.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p><span className="font-medium">Game Points:</span> {team.points}</p>
                        <p><span className="font-medium">Bonus Points:</span> {team.bonusPoints || 0}</p>
                        <p><span className="font-medium text-millionaire-gold">Total Points:</span> <span className="font-bold text-millionaire-gold">{calculateTotalPoints(team)}</span></p>
                        <p><span className="font-medium">Games Played:</span> {team.gamesPlayed}</p>
                        <p><span className="font-medium">Lifelines Used:</span> {team.totalLifelinesUsed || 0}</p>
                      </div>
                      <Button
                        asChild
                        className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
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
                        <TableRow key={team.id} className="border-b border-millionaire-accent">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell className="font-bold text-millionaire-accent">{team.points}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              className="w-20 bg-millionaire-primary text-millionaire-gold border-millionaire-accent"
                              value={team.bonusPoints || 0}
                              onChange={(e) => handleBonusPointsChange(team.id, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-millionaire-gold text-lg">
                            {calculateTotalPoints(team)}
                          </TableCell>
                          <TableCell className="font-medium">{team.gamesPlayed}</TableCell>
                          <TableCell className="font-medium text-millionaire-accent">
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
