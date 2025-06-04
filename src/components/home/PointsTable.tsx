import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Team } from "@/utils/game/types";

interface PointsTableProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
}

const PointsTable = ({ teams, calculateTotalPoints }: PointsTableProps) => {
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
              <TableHead>Total Points</TableHead>
              <TableHead className="text-center">Lifelines Used</TableHead>
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
                <TableCell>{calculateTotalPoints(team)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{team.totalLifelinesUsed || 0}</Badge>
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
