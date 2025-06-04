
import { SoundName } from './types';

export class GameSoundHandler {
  private playSound: (soundName: SoundName) => void;
  private stopSound: (soundName: string) => void;
  private stopAllSounds: () => void;
  private isMutedCheck: () => boolean;
  private isPlayingCheck: (soundName: string) => boolean;
  private suspenseTimeout: number | null = null;
  private finalAnswerActive: boolean = false;

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
    // Clear any pending suspense timeout and final answer state immediately
    this.clearFinalAnswerTimers();
    
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
    // Only apply final-answer + suspense logic for Q6+ (index 5+)
    if (questionIndex >= 5) {
      this.handleFinalAnswerPlayback();
    } else {
      // For Q1-5, just play final-answer normally
      this.playSound('final-answer');
    }
  }

  /**
   * Handles the Final Answer + Suspense flow for questions 6+
   * Step 1: Play final-answer immediately
   * Step 2: After 5 seconds, transition to suspense (if not interrupted)
   */
  public handleFinalAnswerPlayback(): void {
    if (this.isMutedCheck()) {
      return;
    }

    // Clear any existing timers first
    this.clearFinalAnswerTimers();
    
    // Stop all sounds to ensure clean transition
    this.stopAllSounds();
    
    // Step 1: Play final-answer immediately
    this.playSound('final-answer');
    this.finalAnswerActive = true;
    
    // Step 2: Set 5-second timer to transition to suspense
    this.suspenseTimeout = window.setTimeout(() => {
      // Only transition if final answer is still active and not muted
      if (this.finalAnswerActive && !this.isMutedCheck()) {
        // Stop final-answer cleanly
        this.stopSound('final-answer');
        // Play suspense
        this.playSound('suspense');
      }
      // Clear the timeout reference
      this.suspenseTimeout = null;
    }, 5000);
  }

  /**
   * Clears all Final Answer + Suspense timers and resets state
   * Called when answer is declared or game state changes
   */
  private clearFinalAnswerTimers(): void {
    if (this.suspenseTimeout) {
      clearTimeout(this.suspenseTimeout);
      this.suspenseTimeout = null;
    }
    this.finalAnswerActive = false;
  }

  public handleGameEnd(): void {
    this.stopAllSounds();
    this.clearFinalAnswerTimers();
  }

  public handleWin(): void {
    this.stopAllSounds();
    this.clearFinalAnswerTimers();
    this.playSound('win');
  }

  public handlePause(): void {
    // Stop fast-forward on pause (for Q1-5)
    this.stopSound('fast-forward');
    // Also clear final answer timers on pause
    this.clearFinalAnswerTimers();
  }

  public handleWalkAway(): void {
    this.stopAllSounds();
    this.clearFinalAnswerTimers();
  }

  public cleanup(): void {
    this.clearFinalAnswerTimers();
  }
}
