
import { SoundConfig, SoundName } from './types';

export class SoundConfigManager {
  private sounds: Record<string, SoundConfig> = {};

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    const soundFiles = {
      'lets-play': '/sounds/lets-play.mp3.mp3',
      'fast-forward': '/sounds/fast-forward.mp3.mp3', 
      'final-answer': '/sounds/final-answer.mp3.mp3',
      'correct-answer': '/sounds/correct-answer.mp3.mp3',
      'wrong-answer': '/sounds/wrong-answer.mp3.mp3',
      'lifeline': '/sounds/lifeline.mp3.mp3',
      'suspense': '/sounds/suspense.mp3.mp3',
      'win': '/sounds/win.mp3.mp3'
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = 0.7;
      audio.preload = 'auto';
      
      // Set up event listeners
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${name}`, e);
      });

      this.sounds[name] = {
        audio,
        canInterrupt: name !== 'fast-forward', // fast-forward is persistent in Q1-5
        isPersistent: name === 'fast-forward'
      };
    });
  }

  public getSound(soundName: string): SoundConfig | undefined {
    return this.sounds[soundName];
  }

  public getAllSounds(): Record<string, SoundConfig> {
    return this.sounds;
  }
}
