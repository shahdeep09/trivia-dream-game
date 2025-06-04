
import { SoundName } from './types';

export class GameSoundHandler {
  private playSound: (soundName: SoundName) => void;
  private stopSound: (soundName: string) => void;
  private stopAllSounds: () => void;
  private isMutedCheck: () => boolean;
  private isPlayingCheck: (soundName: string) => boolean;
  private suspenseTimeout: number | null = null;

  constructor(
    playSound: (soundName: SoundName) => void,
    stopSound: (soundName: string) => void,
    stopAllSounds: () => void,
    isMutedCheck: () => boolean,
    isPlayingCheck: (soundName: string) => boolean
  ) {
    this.playSound = playSound;
    this.stopSound = stopSound;
    this.stopAllSounds = stopAllSounds;
    this.isMutedCheck = isMutedCheck;
    this.isPlayingCheck = isPlayingCheck;
  }

  public handleGameStart(): void {
    this.stopAllSounds();
    this.playSound('lets-play');
  }

  public handleFastForwardStart(): void {
    // Start fast-forward after lets-play (2 second delay)
    setTimeout(() => {
      if (!this.isMutedCheck()) {
        this.playSound('fast-forward');
      }
    }, 2000);
  }

  public handleOptionSelected(): void {
    // Stop lifeline sound when option is selected
    this.stopSound('lifeline');
  }

  public handleAnswerResult(isCorrect: boolean, questionIndex: number): void {
    // Clear any pending suspense timeout first
    if (this.suspenseTimeout) {
      clearTimeout(this.suspenseTimeout);
      this.suspenseTimeout = null;
    }
    
    // Stop final-answer and suspense sounds immediately when result is shown
    this.stopSound('final-answer');
    this.stopSound('suspense');
    
    if (isCorrect) {
      // Only play correct-answer for questions 6+ (index 5+)
      if (questionIndex >= 5) {
        this.playSound('correct-answer');
      }
    } else {
      // Always play wrong-answer sound (overrides everything including fast-forward)
      this.stopAllSounds();
      this.playSound('wrong-answer');
    }
  }

  public handleQuestionTransition(questionIndex: number): void {
    // Stop fast-forward when moving to question 6 (index 5)
    if (questionIndex === 5) {
      this.stopSound('fast-forward');
    }

    // Play lets-play for questions 6+ (index 5+)
    if (questionIndex >= 5) {
      this.playSound('lets-play');
    }
  }

  public handleLifelineUsed(): void {
    this.playSound('lifeline');
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
      this.stopAllSounds();
      
      // Play final-answer immediately
      this.playSound('final-answer');
      
      // Set timeout to transition to suspense after 5 seconds
      this.suspenseTimeout = window.setTimeout(() => {
        if (!this.isMutedCheck() && this.isPlayingCheck('final-answer')) {
          // Stop final-answer cleanly and play suspense
          this.stopSound('final-answer');
          this.playSound('suspense');
        }
        this.suspenseTimeout = null;
      }, 5000);
    } else {
      // For Q1-5, just play final-answer normally
      this.playSound('final-answer');
    }
  }

  public handleGameEnd(): void {
    this.stopAllSounds();
  }

  public handleWin(): void {
    this.stopAllSounds();
    this.playSound('win');
  }

  public handlePause(): void {
    // Stop fast-forward on pause (for Q1-5)
    this.stopSound('fast-forward');
  }

  public handleWalkAway(): void {
    this.stopAllSounds();
  }

  public cleanup(): void {
    if (this.suspenseTimeout) {
      clearTimeout(this.suspenseTimeout);
      this.suspenseTimeout = null;
    }
  }
}
