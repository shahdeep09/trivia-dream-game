
import { GameAction } from './types';

// Track the action history
export const gameActionHistory: GameAction[] = [];

// Add an action to history
export function addGameAction(action: GameAction): void {
  gameActionHistory.push(action);
}

// Pop the last action from history
export function undoLastAction(): GameAction | undefined {
  return gameActionHistory.pop();
}
