
import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Team } from "@/utils/gameUtils";

interface PointsTableProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
  updateTeamBonusPoints: (teamId: string, bonusPoints: number) => Promise<boolean>;
  updatingTeam: string | null;
}

const PointsTable = ({ 
  teams, 
  calculateTotalPoints,
  updateTeamBonusPoints,
  updatingTeam
}: PointsTableProps) => {
  const [bonusInputs, setBonusInputs] = useState<Record<string, string>>({});

  const handleBonusInputChange = (teamId: string, value: string) => {
    setBonusInputs(prev => ({
      ...prev,
      [teamId]: value
    }));
  };

  const handleSaveBonusPoints = async (teamId: string) => {
    const inputValue = bonusInputs[teamId];
    const bonusPoints = inputValue ? parseInt(inputValue, 10) : 0;
    
    if (isNaN(bonusPoints) || bonusPoints < 0) {
      return;
    }

    const success = await updateTeamBonusPoints(teamId, bonusPoints);
    if (success) {
      // Clear the input after successful save
      setBonusInputs(prev => ({
        ...prev,
        [teamId]: ''
      }));
    }
  };

  const getBonusInputValue = (team: Team) => {
    return bonusInputs[team.id] !== undefined ? bonusInputs[team.id] : team.bonusPoints.toString();
  };

  return (
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
                <TableHead className="text-millionaire-gold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams
                .sort((a, b) => calculateTotalPoints(b) - calculateTotalPoints(a))
                .map((team, index) => (
                  <TableRow key={team.id} className="border-b border-millionaire-accent">
                    <TableCell className="font-medium text-white">{index + 1}</TableCell>
                    <TableCell className="font-medium text-white">{team.name}</TableCell>
                    <TableCell className="font-bold text-white text-lg">{team.points || 0}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={getBonusInputValue(team)}
                        onChange={(e) => handleBonusInputChange(team.id, e.target.value)}
                        className="w-20 bg-millionaire-dark text-white border-millionaire-accent"
                        placeholder="0"
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
                        onClick={() => handleSaveBonusPoints(team.id)}
                        disabled={updatingTeam === team.id}
                        size="sm"
                        className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                      >
                        {updatingTeam === team.id ? 'Saving...' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default PointsTable;
