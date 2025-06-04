import { Question } from './types';

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
