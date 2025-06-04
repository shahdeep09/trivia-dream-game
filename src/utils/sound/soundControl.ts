
// Main sound control functions

import { SOUNDS, activeOscillators, canPlaySound } from './audioConstants';
import { fallbackSounds } from './audioContext';

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

// Stop the fast-forward sound
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

// Stop the lifeline sound
export const stopLifelineSound = (): void => {
  // Stop audio file if playing
  const sound = SOUNDS['lifeline'];
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
  
  // Stop any active fallback oscillators
  activeOscillators['lifeline']?.forEach(oscillator => {
    try {
      oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  activeOscillators['lifeline'] = [];
};

// Stop all sounds
export const stopAllSounds = (): void => {
  // Stop all audio files
  Object.values(SOUNDS).forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
  
  // Stop all active oscillators
  Object.keys(activeOscillators).forEach(key => {
    activeOscillators[key].forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    activeOscillators[key] = [];
  });
};

// Play a sound effect - now with sounds enabled by default and stopping previous sounds
export const playSound = (
  soundName: 'correct-answer' | 'wrong-answer' | 'final-answer' | 'lets-play' | 'suspense' | 'win' | 'lifeline' | 'fast-forward', 
  soundEnabled: boolean = true
): void => {
  if (!soundEnabled) return;
  
  // Stop all other sounds before playing the new one
  stopAllSounds();
  
  const sound = SOUNDS[soundName];
  
  if (sound && canPlaySound(sound)) {
    try {
      // Reset the audio to the beginning and play
      sound.currentTime = 0;
      sound.volume = 0.7; // Ensure audible volume
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
