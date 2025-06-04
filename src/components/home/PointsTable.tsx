
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Save } from "lucide-react";
import { Team } from "@/utils/game/types";

interface PointsTableProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
  handleBonusPointsChange: (teamId: string, value: string) => void;
  saveBonusPoints: (teamId: string) => Promise<void>;
}

const PointsTable = ({ teams, calculateTotalPoints, handleBonusPointsChange, saveBonusPoints }: PointsTableProps) => {
  // Sort teams by total points in descending order
  const sortedTeams = [...teams].sort((a, b) => calculateTotalPoints(b) - calculateTotalPoints(a));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>Current standings based on total points</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Games Played</TableHead>
              <TableHead>Quiz Points</TableHead>
              <TableHead>Bonus Points</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead className="text-center">Lifelines Used</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">
                  {index === 0 && <Trophy className="inline-block text-yellow-500 mr-1" />}
                  {index === 1 && <Medal className="inline-block text-gray-400 mr-1" />}
                  {index === 2 && <Award className="inline-block text-yellow-800 mr-1" />}
                  {index + 1}
                </TableCell>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.gamesPlayed}</TableCell>
                <TableCell>{team.points || 0}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={team.bonusPoints || 0}
                    onChange={(e) => handleBonusPointsChange(team.id, e.target.value)}
                    className="w-20"
                    min="0"
                  />
                </TableCell>
                <TableCell className="font-semibold">{calculateTotalPoints(team)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{team.totalLifelinesUsed || 0}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveBonusPoints(team.id)}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PointsTable;
