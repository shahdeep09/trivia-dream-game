
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Team } from "@/utils/gameUtils";
import { useState } from "react";

interface PointsTableProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
  updateTeamBonusPoints: (teamId: string, bonusPoints: number) => void;
  saveBonusPoints: (teamId: string, bonusPoints: number) => Promise<boolean>;
}

const PointsTable = ({ 
  teams, 
  calculateTotalPoints,
  updateTeamBonusPoints,
  saveBonusPoints 
}: PointsTableProps) => {
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const getInputValue = (teamId: string) => {
    // Use local input value if it exists, otherwise use team's bonus points
    if (inputValues[teamId] !== undefined) {
      return inputValues[teamId];
    }
    const team = teams.find(t => t.id === teamId);
    return String(team?.bonusPoints || 0);
  };

  const handleBonusChange = (teamId: string, value: string) => {
    // Update local input state immediately
    setInputValues(prev => ({ ...prev, [teamId]: value }));
    
    // Update the main team state
    const bonusPoints = parseInt(value) || 0;
    updateTeamBonusPoints(teamId, bonusPoints);
  };

  const handleSave = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setSavingStates(prev => ({ ...prev, [teamId]: true }));
    
    const success = await saveBonusPoints(teamId, team.bonusPoints || 0);
    
    if (success) {
      // Clear the local input value on successful save
      setInputValues(prev => {
        const newValues = { ...prev };
        delete newValues[teamId];
        return newValues;
      });
    }
    
    setSavingStates(prev => ({ ...prev, [teamId]: false }));
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
                <TableHead className="text-millionaire-gold">Actions</TableHead>
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
                        className="w-20 bg-millionaire-primary text-millionaire-gold border-millionaire-accent"
                        value={getInputValue(team.id)}
                        onChange={(e) => handleBonusChange(team.id, e.target.value)}
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
                        onClick={() => handleSave(team.id)}
                        disabled={savingStates[team.id]}
                      >
                        {savingStates[team.id] ? "Saving..." : "Save"}
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
