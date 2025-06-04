
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  value: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface Team {
  id: string;
  name: string;
  points: number;
  gamesPlayed: number;
  bonusPoints?: number;
  totalLifelinesUsed?: number;
}

export interface GameSettings {
  timePerQuestion: number;
  soundEffects: boolean;
  lifelineNames: {
    lifeline1: string;
    lifeline2: string;
    lifeline3: string;
  };
}

export interface GameAction {
  type: 'ANSWER' | 'LIFELINE' | 'WALK_AWAY';
  data: any;
}
