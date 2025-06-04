
// Web Audio API context and fallback sound generation

// Fallback using Web Audio API when files aren't available
export const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

import { activeOscillators } from './audioConstants';

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

export const fallbackSounds: Record<string, (duration: number) => void> = {
  'correct-answer': createBeepSound(700, 0.3),
  'wrong-answer': createBeepSound(200, 0.5),
  'final-answer': createBeepSound(400, 0.3),
  'lets-play': createBeepSound(600, 0.5),
  'suspense': createBeepSound(300, 1.0),
  'win': createTriumphSound(),
  'lifeline': createBeepSound(500, 0.4),
  'fast-forward': createFastForwardSound(),
};
