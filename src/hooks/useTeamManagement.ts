import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Team } from "@/utils/gameUtils";
import { QuizConfig } from "@/types/quiz";

export const useTeamManagement = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);

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
        bonusPoints: team.bonus_points || 0,
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

  const calculateTotalPoints = useCallback((team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0);
  }, []);

  const updateTeamBonusPoints = useCallback((teamId: string, bonusPoints: number) => {
    setTeams(prevTeams => {
      const updatedTeams = prevTeams.map(team =>
        team.id === teamId ? { ...team, bonusPoints } : team
      );
      
      // Update localStorage immediately
      localStorage.setItem("millionaire-teams", JSON.stringify(updatedTeams));
      return updatedTeams;
    });
  }, []);

  const saveBonusPoints = useCallback(async (teamId: string, bonusPoints: number) => {
    if (!user) return false;

    try {
      // Update database
      const { error } = await supabase
        .from('teams')
        .update({ bonus_points: bonusPoints })
        .eq('id', teamId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving bonus points:', error);
        toast({
          title: "Error",
          description: "Failed to save bonus points",
          variant: "destructive"
        });
        return false;
      }

      // The local state is already updated by updateTeamBonusPoints
      // No need to reload teams here - this was causing the input reset issue

      toast({
        title: "Success",
        description: "Bonus points saved successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error saving bonus points:', error);
      toast({
        title: "Error",
        description: "Failed to save bonus points",
        variant: "destructive"
      });
      return false;
    }
  }, [user]);

  return {
    teams,
    setTeams,
    loadTeams,
    calculateTotalPoints,
    updateTeamBonusPoints,
    saveBonusPoints
  };
};
