
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
      
      // Also save to localStorage for compatibility
      localStorage.setItem("millionaire-teams", JSON.stringify(formattedTeams));
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }, [user]);

  const calculateTotalPoints = useCallback((team: Team) => {
    return (team.points || 0) + (team.bonusPoints || 0);
  }, []);

  const handleBonusPointsChange = useCallback((teamId: string, value: string) => {
    const points = parseInt(value) || 0;
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, bonusPoints: points } : team
      )
    );
  }, []);

  const saveBonusPoints = useCallback(async (teamId: string) => {
    if (!user) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    try {
      // Update the database with the bonus points
      const { error } = await supabase
        .from('teams')
        .update({ bonus_points: team.bonusPoints || 0 })
        .eq('id', teamId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving bonus points:', error);
        toast({
          title: "Error",
          description: "Failed to save bonus points",
          variant: "destructive"
        });
        return;
      }

      // Update localStorage immediately with current teams state
      localStorage.setItem("millionaire-teams", JSON.stringify(teams));

      toast({
        title: "Success",
        description: "Bonus points saved successfully"
      });
      
    } catch (error) {
      console.error('Error saving bonus points:', error);
      toast({
        title: "Error",
        description: "Failed to save bonus points",
        variant: "destructive"
      });
    }
  }, [user, teams]);

  return {
    teams,
    setTeams,
    loadTeams,
    calculateTotalPoints,
    handleBonusPointsChange,
    saveBonusPoints
  };
};
