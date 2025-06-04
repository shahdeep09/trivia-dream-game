import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Team } from "@/utils/game/types";
import { Link } from "react-router-dom";
import { Play, Trophy, Target, Zap } from "lucide-react";

interface TeamCardProps {
  team: Team;
  refreshKey: number;
  calculateTotalPoints: (team: Team) => number;
}

const TeamCard = ({ team, refreshKey, calculateTotalPoints }: TeamCardProps) => {
  return (
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
  );
};

export default TeamCard;
