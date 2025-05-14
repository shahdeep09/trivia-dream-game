
// Sound utility functions for the game

// Sound file mapping
const SOUNDS = {
  'correct': new Audio('/sounds/correct-answer.mp3'),
  'wrong': new Audio('/sounds/wrong-answer.mp3'),
  'final-answer': new Audio('/sounds/final-answer.mp3'),
  'lets-play': new Audio('/sounds/lets-play.mp3'),
  'suspense': new Audio('/sounds/suspense.mp3'),
  'win': new Audio('/sounds/win.mp3'),
  'lifeline': new Audio('/sounds/lifeline.mp3'),
};

// Preload all sounds
export const preloadSounds = () => {
  Object.values(SOUNDS).forEach(audio => {
    audio.load();
  });
};

// Play a sound effect
export const playSound = (
  soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline', 
  soundEnabled: boolean
): void => {
  if (!soundEnabled) return;
  
  const sound = SOUNDS[soundName];
  if (sound) {
    // Stop any currently playing sound and reset it
    sound.pause();
    sound.currentTime = 0;
    
    // Play the sound
    sound.play().catch(error => {
      console.error(`Error playing sound ${soundName}:`, error);
    });
  }
};
