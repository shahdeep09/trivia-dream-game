
export interface SoundConfig {
  audio: HTMLAudioElement;
  canInterrupt: boolean;
  isPersistent: boolean;
}

export type SoundName = 
  | 'lets-play'
  | 'fast-forward'
  | 'final-answer'
  | 'correct-answer'
  | 'wrong-answer'
  | 'lifeline'
  | 'suspense'
  | 'win';
