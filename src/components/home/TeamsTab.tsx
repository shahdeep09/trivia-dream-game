
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Team } from "@/utils/gameUtils";
import TeamCard from "./TeamCard";

interface TeamsTabProps {
  teams: Team[];
  calculateTotalPoints: (team: Team) => number;
}

const TeamsTab = React.memo(({ teams, calculateTotalPoints }: TeamsTabProps) => {
  return (
    <TabsContent value="teams">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            calculateTotalPoints={calculateTotalPoints}
          />
        ))}
      </div>
    </TabsContent>
  );
});

TeamsTab.displayName = 'TeamsTab';

export default TeamsTab;
