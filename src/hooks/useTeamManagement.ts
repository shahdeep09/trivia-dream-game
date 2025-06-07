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
        bonusPoints: 0, // Always 0 since we're removing bonus points
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
    return team.points || 0; // Only game points, no bonus points
  }, []);

  return {
    teams,
    setTeams,
    loadTeams,
    calculateTotalPoints
  };
};
