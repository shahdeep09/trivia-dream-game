
// Centralized Sound Management System
// Single source of truth for all game audio

interface SoundConfig {
  audio: HTMLAudioElement;
  canInterrupt: boolean;
  isPersistent: boolean;
}

class SoundManager {
  private sounds: Record<string, SoundConfig> = {};
  private currentlyPlaying: Set<string> = new Set();
  private isMuted: boolean = false;
  private suspenseTimeout: number | null = null;

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
      audio.addEventListener('ended', () => {
        this.currentlyPlaying.delete(name);
      });

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

  public play(soundName: string): void {
    if (this.isMuted || !this.sounds[soundName]) {
      return;
    }

    const soundConfig = this.sounds[soundName];
    
    // Stop all other sounds before playing new one (except persistent ones)
    this.currentlyPlaying.forEach(playingSound => {
      if (playingSound !== soundName && this.sounds[playingSound].canInterrupt) {
        this.stop(playingSound);
      }
    });

    // Reset and play the sound
    soundConfig.audio.currentTime = 0;
    soundConfig.audio.play().catch(error => {
      console.warn(`Failed to play sound: ${soundName}`, error);
    });

    this.currentlyPlaying.add(soundName);
  }

  public stop(soundName: string): void {
    if (!this.sounds[soundName]) return;

    const audio = this.sounds[soundName].audio;
    audio.pause();
    audio.currentTime = 0;
    this.currentlyPlaying.delete(soundName);
  }

  public stopAll(): void {
    this.currentlyPlaying.forEach(soundName => {
      this.stop(soundName);
    });
    this.currentlyPlaying.clear();
    
    // Clear any pending suspense timeout
    if (this.suspenseTimeout) {
      clearTimeout(this.suspenseTimeout);
      this.suspenseTimeout = null;
    }
  }

  public isPlaying(soundName: string): boolean {
    return this.currentlyPlaying.has(soundName);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  // Specific game logic methods
  public handleGameStart(): void {
    this.stopAll();
    this.play('lets-play');
  }

  public handleFastForwardStart(): void {
    // Start fast-forward after lets-play (2 second delay)
    setTimeout(() => {
      if (!this.isMuted) {
        this.play('fast-forward');
      }
    }, 2000);
  }

  public handleOptionSelected(): void {
    // Stop lifeline sound when option is selected
    this.stop('lifeline');
  }

  public handleAnswerResult(isCorrect: boolean, questionIndex: number): void {
    // Clear any pending suspense timeout first
    if (this.suspenseTimeout) {
      clearTimeout(this.suspenseTimeout);
      this.suspenseTimeout = null;
    }
    
    // Stop final-answer and suspense sounds immediately when result is shown
    this.stop('final-answer');
    this.stop('suspense');
    
    if (isCorrect) {
      // Only play correct-answer for questions 6+ (index 5+)
      if (questionIndex >= 5) {
        this.play('correct-answer');
      }
    } else {
      // Always play wrong-answer sound (overrides everything including fast-forward)
      this.stopAll();
      this.play('wrong-answer');
    }
  }

  public handleQuestionTransition(questionIndex: number): void {
    // Stop fast-forward when moving to question 6 (index 5)
    if (questionIndex === 5) {
      this.stop('fast-forward');
    }

    // Play lets-play for questions 6+ (index 5+)
    if (questionIndex >= 5) {
      this.play('lets-play');
    }
  }

  public handleLifelineUsed(): void {
    this.play('lifeline');
  }

  public handleFinalAnswerClicked(questionIndex: number): void {
    // Only apply final-answer + suspense logic for Q6+ (normal-paced round)
    if (questionIndex >= 5) {
      // Clear any existing timeout first
      if (this.suspenseTimeout) {
        clearTimeout(this.suspenseTimeout);
        this.suspenseTimeout = null;
      }
      
      // Stop all sounds to ensure clean transition
      this.stopAll();
      
      // Play final-answer immediately
      this.play('final-answer');
      
      // Set timeout to transition to suspense after 5 seconds
      this.suspenseTimeout = window.setTimeout(() => {
        if (!this.isMuted && this.isPlaying('final-answer')) {
          // Stop final-answer cleanly and play suspense
          this.stop('final-answer');
          this.play('suspense');
        }
        this.suspenseTimeout = null;
      }, 5000);
    } else {
      // For Q1-5, just play final-answer normally
      this.play('final-answer');
    }
  }

  public handleGameEnd(): void {
    this.stopAll();
  }

  public handleWin(): void {
    this.stopAll();
    this.play('win');
  }

  public handlePause(): void {
    // Stop fast-forward on pause (for Q1-5)
    this.stop('fast-forward');
  }

  public handleWalkAway(): void {
    this.stopAll();
  }
}

// Create singleton instance
export const soundManager = new SoundManager();
