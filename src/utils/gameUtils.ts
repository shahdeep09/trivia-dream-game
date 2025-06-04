import { toast } from "@/hooks/use-toast";
import { playSound } from "./sound";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  value: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string; // New field for answer explanation
}

export interface Team {
  id: string;
  name: string;
  points: number;
  gamesPlayed: number;
  bonusPoints?: number;
  totalLifelinesUsed?: number; // New field for tracking lifeline usage
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

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timePerQuestion: 30,
  soundEffects: true, // Ensure sounds are enabled by default
  lifelineNames: {
    lifeline1: "50:50",
    lifeline2: "Phone a Friend",
    lifeline3: "Ask the Audience",
  }
};

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

// New points and timer logic based on question levels
export const getQuestionConfig = (questionIndex: number) => {
  if (questionIndex < 5) {
    return { points: 100, timeLimit: 30 };
  } else if (questionIndex < 10) {
    return { points: 200, timeLimit: 60 };
  } else {
    return { points: 300, timeLimit: 90 };
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

// Shuffle options for a question while preserving the correct answer
export function shuffleOptions(question: Question): Question {
  const shuffledQuestion = { ...question };
  const correctOption = question.options[question.correctOptionIndex];
  
  // Create a copy and shuffle
  const shuffledOptions = [...question.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  // Find the new index of the correct option
  const newCorrectIndex = shuffledOptions.findIndex(option => option === correctOption);
  
  return {
    ...shuffledQuestion,
    options: shuffledOptions,
    correctOptionIndex: newCorrectIndex
  };
}

// Get a formatted money string
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + " points";
}

// Get the guaranteed money amount based on current level - modified to remove stage logic
export function getGuaranteedMoney(currentLevel: number): number {
  // Modified to always return earned points, not milestone points
  return POINTS_VALUES[currentLevel];
}

// Apply the 50:50 lifeline to a question
export function applyFiftyFifty(question: Question): number[] {
  const correctIndex = question.correctOptionIndex;
  const wrongIndices = question.options.map((_, index) => index).filter(i => i !== correctIndex);
  
  // Randomly choose two wrong options to keep (along with the correct one)
  const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5);
  const optionsToKeep = [correctIndex, shuffledWrong[0]].sort((a, b) => a - b);
  const optionsToRemove = question.options.map((_, index) => index).filter(i => !optionsToKeep.includes(i));
  
  return optionsToRemove;
}

// Simulate "Phone a Friend" lifeline - returns an advice message
export function phoneAFriend(question: Question): string {
  const correctAnswer = question.options[question.correctOptionIndex];
  const letterMapping = ['A', 'B', 'C', 'D'];
  const correctLetter = letterMapping[question.correctOptionIndex];
  
  // Simulate accuracy of friend (75% chance of being correct)
  const isCorrect = Math.random() < 0.75;
  
  if (isCorrect) {
    return `I'm quite confident the answer is ${correctLetter}. "${correctAnswer}" sounds right.`;
  } else {
    // Pick a random wrong answer
    const wrongOptions = question.options
      .map((opt, idx) => ({ option: opt, letter: letterMapping[idx] }))
      .filter((_, idx) => idx !== question.correctOptionIndex);
    
    const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    return `I'm not entirely sure, but I think it might be ${randomWrong.letter}. "${randomWrong.option}" seems like the answer.`;
  }
}

// Simulate "Ask the Audience" lifeline - returns percentage distribution
export function askTheAudience(question: Question): number[] {
  const correctIndex = question.correctOptionIndex;
  let percentages = [0, 0, 0, 0];
  
  // Difficulty affects how accurate the audience is
  const difficulty = question.difficulty || 'medium';
  let correctPercentBase = difficulty === 'easy' ? 65 : (difficulty === 'medium' ? 55 : 40);
  
  // Add some randomness
  const correctPercent = correctPercentBase + Math.floor(Math.random() * 20);
  percentages[correctIndex] = correctPercent;
  
  // Distribute remaining percentage among other options
  const remainingPercent = 100 - correctPercent;
  let allocated = 0;
  
  for (let i = 0; i < 4; i++) {
    if (i !== correctIndex) {
      const maxAlloc = remainingPercent - allocated - (3 - i - 1); // Ensure we can allocate to remaining options
      const minAlloc = 1; // Minimum 1% for each option
      const randomAlloc = Math.floor(Math.random() * (maxAlloc - minAlloc + 1)) + minAlloc;
      
      percentages[i] = randomAlloc;
      allocated += randomAlloc;
    }
  }
  
  // Handle any rounding issues
  if (allocated < remainingPercent) {
    percentages[correctIndex] += (remainingPercent - allocated);
  }
  
  return percentages;
}

// Enhanced play sound function with fast-forward logic
export function playSoundWithLogic(
  soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline' | 'fast-forward',
  settings: GameSettings,
  questionLevel?: number
): void {
  if (!settings.soundEffects) return;
  
  // For correct answers in first 5 questions (index 0-4), don't play correct-answer sound
  if (questionLevel !== undefined && questionLevel < 5 && soundName === 'correct') {
    // Don't play any sound for correct answers in first 5 questions
    return;
  }
  
  // Map the sound names to match the actual sound file names
  let actualSoundName: 'correct-answer' | 'wrong-answer' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline' | 'fast-forward';
  
  switch (soundName) {
    case 'correct':
      actualSoundName = 'correct-answer';
      break;
    case 'wrong':
      actualSoundName = 'wrong-answer';
      break;
    default:
      actualSoundName = soundName as any;
  }
  
  // For all other cases, play the requested sound
  playSound(actualSoundName, settings.soundEffects);
  
  // Also show a toast notification for visual feedback
  toast({
    title: `Sound Effect`,
    description: `${soundName} sound playing`,
    duration: 1000,
  });
}

// New function to undo the last action (for history tracking)
export interface GameAction {
  type: 'ANSWER' | 'LIFELINE' | 'WALK_AWAY';
  data: any;
}

// Track the action history
export const gameActionHistory: GameAction[] = [];

// Add an action to history
export function addGameAction(action: GameAction): void {
  gameActionHistory.push(action);
}

// Pop the last action from history
export function undoLastAction(): GameAction | undefined {
  return gameActionHistory.pop();
}
