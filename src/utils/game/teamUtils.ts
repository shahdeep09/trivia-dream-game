
import { Team } from './types';

// Load teams from localStorage with user-specific isolation
export function loadTeams(userId?: string, quizId?: string): Team[] {
  try {
    // If user and quiz IDs are provided, try user-specific key first
    if (userId && quizId) {
      const userSpecificKey = `teams-${quizId}-${userId}`;
      const userSpecificTeams = localStorage.getItem(userSpecificKey);
      if (userSpecificTeams) {
        console.log('Loading user-specific teams:', userSpecificKey);
        return JSON.parse(userSpecificTeams);
      }
    }
    
    // Fallback to general teams
    const storedTeams = localStorage.getItem("quiz-teams");
    if (storedTeams) {
      console.log('Loading general teams');
      return JSON.parse(storedTeams);
    }
    return [];
  } catch (error) {
    console.error("Error loading teams:", error);
    return [];
  }
}

// Save teams to localStorage with user-specific isolation
export function saveTeams(teams: Team[], userId?: string, quizId?: string): void {
  try {
    // Save to user-specific key if provided
    if (userId && quizId) {
      const userSpecificKey = `teams-${quizId}-${userId}`;
      localStorage.setItem(userSpecificKey, JSON.stringify(teams));
      console.log('Teams saved with user-specific key:', userSpecificKey);
    }
    
    // Also save to general key for backward compatibility
    localStorage.setItem("quiz-teams", JSON.stringify(teams));
    console.log('Teams saved to general key');
  } catch (error) {
    console.error("Error saving teams:", error);
  }
}
