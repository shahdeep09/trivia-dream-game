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
  'fast-forward': new Audio('/sounds/fast-forward.mp3'), // Fast-forward sound
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
  'fast-forward': createFastForwardSound(), // Fast-forward sound fallback
};

// Store active oscillators for sounds that need to be stopped
const activeOscillators: Record<string, OscillatorNode[]> = {
  'suspense': [],
  'fast-forward': [], // For fast-forward sound
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

// Function to create a fast-forward sound
function createFastForwardSound() {
  return () => {
    try {
      // Play a sequence of quick tones for a fast-forward effect
      const frequencies = [600, 650, 700, 750, 800];
      const durations = [0.1, 0.1, 0.1, 0.1, 0.1];
      
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
          
          // Store the oscillator for potential stopping
          activeOscillators['fast-forward'].push(oscillator);
          
          setTimeout(() => {
            oscillator.stop();
            const index = activeOscillators['fast-forward'].indexOf(oscillator);
            if (index > -1) {
              activeOscillators['fast-forward'].splice(index, 1);
            }
          }, durations[index] * 1000);
        }, index * 100);
      });
    } catch (error) {
      console.error('Error creating fast-forward sound:', error);
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

// New function to stop the fast-forward sound
export const stopFastForwardSound = (): void => {
  // Stop audio file if playing
  const sound = SOUNDS['fast-forward'];
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
  
  // Stop any active fallback oscillators
  activeOscillators['fast-forward']?.forEach(oscillator => {
    try {
      oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  activeOscillators['fast-forward'] = [];
};

// Play a sound effect - now with sounds enabled
export const playSound = (
  soundName: 'correct' | 'wrong' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline' | 'fast-forward', 
  soundEnabled: boolean
): void => {
  if (!soundEnabled) return;
  
  const sound = SOUNDS[soundName];
  
  if (sound && canPlaySound(sound)) {
    try {
      // Reset the audio to the beginning and play
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.warn(`Could not play sound file for ${soundName}, using fallback:`, error);
        // Use fallback sound if file fails to play
        if (fallbackSounds[soundName]) {
          fallbackSounds[soundName](1.0);
        }
      });
    } catch (error) {
      console.warn(`Error playing sound file for ${soundName}, using fallback:`, error);
      // Use fallback sound if there's an error
      if (fallbackSounds[soundName]) {
        fallbackSounds[soundName](1.0);
      }
    }
  } else {
    // Use fallback sound when audio file is not available
    if (fallbackSounds[soundName]) {
      fallbackSounds[soundName](1.0);
    }
  }
};
