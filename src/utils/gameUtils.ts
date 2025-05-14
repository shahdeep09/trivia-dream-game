import { toast } from "@/hooks/use-toast";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  value: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
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
  soundEffects: true,
  lifelineNames: {
    lifeline1: "50:50",
    lifeline2: "Phone a Friend",
    lifeline3: "Ask the Audience",
  }
};

// Money ladder values in order (smallest to largest)
export const MONEY_VALUES = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000
];

// Milestone values (guaranteed money)
export const MILESTONE_VALUES = [1000, 32000, 1000000];

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
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Get the guaranteed money amount based on current level
export function getGuaranteedMoney(currentLevel: number): number {
  if (currentLevel < 5) return 0;
  if (currentLevel < 10) return 1000;
  if (currentLevel < 15) return 32000;
  return 1000000;
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

// Play a sound effect
export function playSound(soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline', settings: GameSettings): void {
  if (!settings.soundEffects) return;
  
  // This would ideally connect to actual sound files
  console.log(`Playing sound: ${soundName}`);
  
  // Simulate sound by showing a toast notification (for development)
  toast({
    title: `Sound Effect`,
    description: `${soundName} sound would play here`,
    duration: 1000,
  });
}
