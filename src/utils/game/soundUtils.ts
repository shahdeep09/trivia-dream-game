
import { toast } from "@/hooks/use-toast";
import { soundManager } from "@/utils/sound/RefactoredSoundManager";
import { GameSettings } from './types';

// Enhanced play sound function with fast-forward logic
export function playSoundWithLogic(
  soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'win' | 'lifeline' | 'fast-forward' | 'suspense',
  settings: GameSettings,
  questionLevel?: number
): void {
  if (!settings.soundEffects) return;
  
  // First stop all previous sounds
  soundManager.stopAll();
  
  // For correct answers in first 5 questions (index 0-4), don't play correct-answer sound
  if (questionLevel !== undefined && questionLevel < 5 && soundName === 'correct') {
    // Don't play any sound for correct answers in first 5 questions
    return;
  }
  
  // Map the sound names to match the actual sound file names
  let actualSoundName: 'correct-answer' | 'wrong-answer' | 'final-answer' | 'lets-play' | 'win' | 'lifeline' | 'fast-forward' | 'suspense' = soundName === 'correct' ? 'correct-answer' : soundName === 'wrong' ? 'wrong-answer' : soundName;
  
  // For all other cases, play the requested sound
  soundManager.play(actualSoundName);
  
  // Also show a toast notification for visual feedback
  toast({
    title: `Sound Effect`,
    description: `${soundName} sound playing`,
    duration: 1000,
  });
}
