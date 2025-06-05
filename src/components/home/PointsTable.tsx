
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Team } from "@/utils/gameUtils";

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
  );
};

export default PointsTable;
