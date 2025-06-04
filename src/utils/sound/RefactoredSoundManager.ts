
import { SoundConfig, SoundName } from './types';
import { SoundConfigManager } from './SoundConfig';
import { GameSoundHandler } from './GameSoundHandler';

class RefactoredSoundManager {
  private soundConfig: SoundConfigManager;
  private gameHandler: GameSoundHandler;
  private currentlyPlaying: Set<string> = new Set();
  private isMuted: boolean = false;

  constructor() {
    this.soundConfig = new SoundConfigManager();
    this.gameHandler = new GameSoundHandler(
      this.play.bind(this),
      this.stop.bind(this),
      this.stopAll.bind(this),
      this.isMutedState.bind(this),
      this.isPlaying.bind(this)
    );
    this.setupAudioEventListeners();
  }

  private setupAudioEventListeners(): void {
    Object.entries(this.soundConfig.getAllSounds()).forEach(([name, config]) => {
      config.audio.addEventListener('ended', () => {
        this.currentlyPlaying.delete(name);
      });
    });
  }

  public play(soundName: SoundName): void {
    if (this.isMuted) {
      return;
    }

    const soundConfig = this.soundConfig.getSound(soundName);
    if (!soundConfig) {
      return;
    }
    
    // Stop all other sounds before playing new one (except persistent ones)
    this.currentlyPlaying.forEach(playingSound => {
      const playingSoundConfig = this.soundConfig.getSound(playingSound);
      if (playingSound !== soundName && playingSoundConfig?.canInterrupt) {
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
    const soundConfig = this.soundConfig.getSound(soundName);
    if (!soundConfig) return;

    const audio = soundConfig.audio;
    audio.pause();
    audio.currentTime = 0;
    this.currentlyPlaying.delete(soundName);
  }

  public stopAll(): void {
    this.currentlyPlaying.forEach(soundName => {
      this.stop(soundName);
    });
    this.currentlyPlaying.clear();
    this.gameHandler.cleanup();
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

  // Delegate game-specific methods to GameSoundHandler
  public handleGameStart(): void {
    this.gameHandler.handleGameStart();
  }

  public handleFastForwardStart(): void {
    this.gameHandler.handleFastForwardStart();
  }

  public handleOptionSelected(): void {
    this.gameHandler.handleOptionSelected();
  }

  public handleAnswerResult(isCorrect: boolean, questionIndex: number): void {
    this.gameHandler.handleAnswerResult(isCorrect, questionIndex);
  }

  public handleQuestionTransition(questionIndex: number): void {
    this.gameHandler.handleQuestionTransition(questionIndex);
  }

  public handleLifelineUsed(): void {
    this.gameHandler.handleLifelineUsed();
  }

  public handleFinalAnswerClicked(questionIndex: number): void {
    this.gameHandler.handleFinalAnswerClicked(questionIndex);
  }

  public handleGameEnd(): void {
    this.gameHandler.handleGameEnd();
  }

  public handleWin(): void {
    this.gameHandler.handleWin();
  }

  public handlePause(): void {
    this.gameHandler.handlePause();
  }

  public handleWalkAway(): void {
    this.gameHandler.handleWalkAway();
  }
}

// Create singleton instance
export const soundManager = new RefactoredSoundManager();
