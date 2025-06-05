
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Team } from "@/utils/gameUtils";
import { useState, useEffect } from "react";

interface PointsTableProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
  handleBonusPointsChange: (teamId: string, value: string) => void;
  saveBonusPoints: (teamId: string) => Promise<void>;
}

const PointsTable = ({ 
  teams, 
  calculateTotalPoints, 
  handleBonusPointsChange, 
  saveBonusPoints 
}: PointsTableProps) => {
  const [localBonusPoints, setLocalBonusPoints] = useState<Record<string, number>>({});

  // Initialize local bonus points when teams change, but only if local state is empty
  useEffect(() => {
    if (Object.keys(localBonusPoints).length === 0) {
      const initialBonusPoints: Record<string, number> = {};
      teams.forEach(team => {
        initialBonusPoints[team.id] = team.bonusPoints || 0;
      });
      setLocalBonusPoints(initialBonusPoints);
    }
  }, [teams, localBonusPoints]);

  const handleLocalBonusChange = (teamId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalBonusPoints(prev => ({
      ...prev,
      [teamId]: numValue
    }));
    // Don't call parent handler here - only update local state
  };

  const handleSave = async (teamId: string) => {
    // Update parent state with the local value before saving
    const localValue = localBonusPoints[teamId] || 0;
    handleBonusPointsChange(teamId, localValue.toString());
    await saveBonusPoints(teamId);
    
    // After saving, sync the local state with the saved value
    setLocalBonusPoints(prev => ({
      ...prev,
      [teamId]: localValue
    }));
  };

  // Calculate total points using local bonus points
  const calculateLocalTotalPoints = (team: Team) => {
    const localBonus = localBonusPoints[team.id] || team.bonusPoints || 0;
    return (team.points || 0) + localBonus;
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
                .sort((a, b) => calculateLocalTotalPoints(b) - calculateLocalTotalPoints(a))
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
                        value={localBonusPoints[team.id] || 0}
                        onChange={(e) => handleLocalBonusChange(team.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-millionaire-gold text-xl">
                      {calculateLocalTotalPoints(team)}
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
  );
};

export default PointsTable;
