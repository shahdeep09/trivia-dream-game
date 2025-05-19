
// Sound utility functions for the game

// Sound file mapping
const SOUNDS: Record<string, HTMLAudioElement> = {
  'correct': new Audio('/sounds/correct-answer.mp3'),
  'wrong': new Audio('/sounds/wrong-answer.mp3'),
  'final-answer': new Audio('/sounds/final-answer.mp3'),
  'lets-play': new Audio('/sounds/lets-play.mp3'),
  'suspense': new Audio('/sounds/suspense.mp3'),
  'win': new Audio('/sounds/win.mp3'),
  'lifeline': new Audio('/sounds/lifeline.mp3'),
};

// Fallback using Web Audio API when files aren't available
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const fallbackSounds: Record<string, (duration: number) => void> = {
  'correct': createBeepSound(700, 0.3),
  'wrong': createBeepSound(200, 0.5),
  'final-answer': createBeepSound(400, 0.3),
  'lets-play': createBeepSound(600, 0.5),
  'suspense': createBeepSound(300, 1.0),
  'win': createTriumphSound(),
  'lifeline': createBeepSound(500, 0.4),
};

// Store active oscillators for sounds that need to be stopped
const activeOscillators: Record<string, OscillatorNode[]> = {
  'suspense': [],
};

// Function to create a simple beep sound
function createBeepSound(frequency: number, duration: number) {
  return () => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      // For suspense sound, store the oscillator to control it later
      if (frequency === 300) {
        activeOscillators.suspense.push(oscillator);
      }
      
      setTimeout(() => {
        oscillator.stop();
        // Remove from active oscillators if it was stored
        if (frequency === 300) {
          const index = activeOscillators.suspense.indexOf(oscillator);
          if (index > -1) {
            activeOscillators.suspense.splice(index, 1);
          }
        }
      }, duration * 1000);
    } catch (error) {
      console.error('Error creating fallback sound:', error);
    }
  };
}

// Function to create a triumph sound (for winning)
function createTriumphSound() {
  return () => {
    try {
      // Play a sequence of tones for a triumphant sound
      const frequencies = [400, 500, 600, 800];
      const durations = [0.1, 0.1, 0.1, 0.5];
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.value = freq;
          gainNode.gain.value = 0.1;
          
          oscillator.start();
          
          setTimeout(() => {
            oscillator.stop();
          }, durations[index] * 1000);
        }, index * 250);
      });
    } catch (error) {
      console.error('Error creating triumph sound:', error);
    }
  };
}

// Preload all sounds
export const preloadSounds = () => {
  Object.values(SOUNDS).forEach(audio => {
    audio.load();
  });
};

// Check if a sound file can be played
const canPlaySound = (audio: HTMLAudioElement): boolean => {
  // Check if the browser can play this audio format
  return !!audio.canPlayType && audio.canPlayType('audio/mpeg') !== '';
};

// Stop the currently playing suspense sound
export const stopSuspenseSound = (): void => {
  // Stop audio file if playing
  const sound = SOUNDS['suspense'];
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
  
  // Stop any active fallback oscillators
  activeOscillators.suspense.forEach(oscillator => {
    try {
      oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  activeOscillators.suspense = [];
};

// Play a sound effect
export const playSound = (
  soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline', 
  soundEnabled: boolean
): void => {
  if (!soundEnabled) return;
  
  // For final-answer, correct or wrong answers, stop any playing suspense sound
  if (soundName === 'final-answer' || soundName === 'correct' || soundName === 'wrong') {
    stopSuspenseSound();
  }
  
  // For suspense, loop the sound if possible
  if (soundName === 'suspense') {
    const sound = SOUNDS[soundName];
    if (sound) {
      sound.loop = true;
    }
  }
  
  const sound = SOUNDS[soundName];
  if (sound) {
    // Try to play the actual sound file
    sound.pause();
    sound.currentTime = 0;
    
    sound.play()
      .then(() => {
        // Sound played successfully
      })
      .catch(error => {
        console.warn(`Audio file for ${soundName} couldn't be played, using fallback sound:`, error);
        // If the audio file doesn't exist or can't be played, use the fallback sound
        if (fallbackSounds[soundName]) {
          // For suspense, loop the sound by playing it repeatedly
          if (soundName === 'suspense') {
            const loopSound = () => {
              fallbackSounds[soundName](3.0);
              setTimeout(loopSound, 3000);
            };
            loopSound();
          } else {
            fallbackSounds[soundName](0.5);
          }
        }
      });
  }
};
