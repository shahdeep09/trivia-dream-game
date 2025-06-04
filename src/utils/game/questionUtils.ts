
import { Question } from './types';
import { POINTS_VALUES } from './constants';

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
