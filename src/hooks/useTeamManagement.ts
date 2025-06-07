
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Team } from "@/utils/gameUtils";
import { QuizConfig } from "@/types/quiz";

export const useTeamManagement = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [updatingTeam, setUpdatingTeam] = useState<string | null>(null);

  const loadTeams = useCallback(async (currentQuizConfig: QuizConfig | null) => {
    if (!currentQuizConfig || !user) return;

    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('quiz_id', currentQuizConfig.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading teams:', error);
        return;
      }

      const formattedTeams: Team[] = teamsData?.map(team => ({
        id: team.id,
        name: team.name,
        points: team.points || 0,
        bonusPoints: team.bonus_points || 0, // Load bonus points from database
        gamesPlayed: team.games_played || 0,
        totalLifelinesUsed: team.total_lifelines_used || 0
      })) || [];

      setTeams(formattedTeams);
      
      // Keep localStorage in sync
      localStorage.setItem("millionaire-teams", JSON.stringify(formattedTeams));
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }, [user]);

  const updateTeamBonusPoints = useCallback(async (teamId: string, bonusPoints: number) => {
    if (!user) return false;

    setUpdatingTeam(teamId);

    try {
      const { error } = await supabase
        .from('teams')
        .update({ bonus_points: bonusPoints })
        .eq('id', teamId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating bonus points:', error);
        toast({
          title: "Error",
          description: "Failed to update bonus points. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId 
            ? { ...team, bonusPoints } 
            : team
        )
      );

      // Update localStorage
      const updatedTeams = teams.map(team => 
        team.id === teamId 
          ? { ...team, bonusPoints } 
          : team
      );
      localStorage.setItem("millionaire-teams", JSON.stringify(updatedTeams));

      toast({
        title: "Success",
        description: "Bonus points updated successfully!",
      });

      return true;
    } catch (error) {
      console.error('Error updating bonus points:', error);
      toast({
        title: "Error",
        description: "Failed to update bonus points. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setUpdatingTeam(null);
    }
  }, [user, teams]);

  const calculateTotalPoints = useCallback((team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0); // Include bonus points in total
  }, []);

  return {
    teams,
    setTeams,
    loadTeams,
    updateTeamBonusPoints,
    calculateTotalPoints,
    updatingTeam
  };
};
