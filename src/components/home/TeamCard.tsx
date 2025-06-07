
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Team } from "@/utils/gameUtils";

interface TeamCardProps {
  team: Team;
  calculateTotalPoints: (team: Team) => number;
}

const TeamCard = React.memo(({ team, calculateTotalPoints }: TeamCardProps) => {
  return (
    <Card className="bg-millionaire-secondary border-millionaire-accent">
      <CardHeader>
        <CardTitle className="text-millionaire-gold">{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p><span className="font-medium text-millionaire-gold">Points:</span> <span className="font-bold text-millionaire-gold text-lg">{calculateTotalPoints(team)}</span></p>
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
});

TeamCard.displayName = 'TeamCard';

export default TeamCard;
