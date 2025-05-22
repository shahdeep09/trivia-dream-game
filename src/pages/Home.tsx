
import { useState, useEffect } from "react";
import { Team, SAMPLE_TEAMS } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  
  useEffect(() => {
    // Load teams from localStorage or use sample data
    const savedTeams = localStorage.getItem("millionaire-teams");
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    } else {
      setTeams(SAMPLE_TEAMS);
    }
  }, []);
  
  // Save teams to localStorage whenever they change
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem("millionaire-teams", JSON.stringify(teams));
    }
  }, [teams]);
  
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold">Who Wants to Be a Millionaire</h1>
            <p className="text-millionaire-light mt-2">
              Team Competition
            </p>
          </div>
          <Button
            asChild
            className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
          >
            <Link to="/">Play Game</Link>
          </Button>
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
                      <div>
                        <p><span className="font-medium">Total Points:</span> {team.points}</p>
                        <p><span className="font-medium">Games Played:</span> {team.gamesPlayed}</p>
                      </div>
                      <Button
                        asChild
                        className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
                      >
                        <Link to={`/?team=${team.id}`}>Play</Link>
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
                      <TableHead className="text-millionaire-gold">Points</TableHead>
                      <TableHead className="text-millionaire-gold">Games Played</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams
                      .sort((a, b) => b.points - a.points)
                      .map((team, index) => (
                        <TableRow key={team.id} className="border-b border-millionaire-accent">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{team.name}</TableCell>
                          <TableCell>{team.points}</TableCell>
                          <TableCell>{team.gamesPlayed}</TableCell>
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
