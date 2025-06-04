
// Sound file mapping and constants

export const SOUNDS: Record<string, HTMLAudioElement> = {
  'correct-answer': new Audio('/sounds/correct-answer.mp3.mp3'),
  'wrong-answer': new Audio('/sounds/wrong-answer.mp3.mp3'),
  'final-answer': new Audio('/sounds/final-answer.mp3.mp3'),
  'lets-play': new Audio('/sounds/lets-play.mp3.mp3'),
  'suspense': new Audio('/sounds/suspense.mp3.mp3'),
  'win': new Audio('/sounds/win.mp3.mp3'),
  'lifeline': new Audio('/sounds/lifeline.mp3.mp3'),
  'fast-forward': new Audio('/sounds/fast-forward.mp3.mp3'),
};

// Store active oscillators for sounds that need to be stopped
export const activeOscillators: Record<string, OscillatorNode[]> = {
  'suspense': [],
  'fast-forward': [],
  'lifeline': [],
};

// Preload all sounds
export const preloadSounds = () => {
  Object.values(SOUNDS).forEach(audio => {
    audio.load();
    // Set volume to ensure sounds are audible
    audio.volume = 0.7;
  });
};

// Check if a sound file can be played
export const canPlaySound = (audio: HTMLAudioElement): boolean => {
  // Check if the browser can play this audio format
  return !!audio.canPlayType && audio.canPlayType('audio/mpeg') !== '';
};
