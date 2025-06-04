
import { GameSettings } from './types';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timePerQuestion: 30,
  soundEffects: true,
  lifelineNames: {
    lifeline1: "50:50",
    lifeline2: "Phone a Friend",
    lifeline3: "Ask the Audience",
  }
};

// Money ladder values based on new logic (15 questions total)
export const POINTS_VALUES = [
  100, 100, 100, 100, 100, // Questions 1-5: 100 points each
  200, 200, 200, 200, 200, // Questions 6-10: 200 points each
  300, 300, 300, 300, 300  // Questions 11-15: 300 points each
];

// Milestone values (guaranteed money) - renamed to MILESTONE_POINTS
export const MILESTONE_VALUES = [100, 200, 300];
