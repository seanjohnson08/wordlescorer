import getMultiplier from './get-multiplier.js';
import { SCORE } from '../const/SCORE-CONST.js';

/**
 * Provides a bonus per square based on where the wordle was solved.
 * @param {number} solvedRow - row number where a solve occured (must be between 1-6)
 * @returns {number} integer bonus amount
 */
export function getPointBonus(solvedRow: number): number {
  let bonus: number = 0;
  const blocksPerRow: number = 5;
  const solvedBlockValue: number = SCORE.CORRECT;
  let i: number = solvedRow;
  for (; i <= 5; i++) {
    bonus += solvedBlockValue * blocksPerRow * getMultiplier((solvedRow * 5) - 1);
  }
  return bonus;
}