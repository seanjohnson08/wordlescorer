import { getMultiplier } from './get-multiplier.js';
import { getPointBonus } from './get-point-bonus.js';

/**
 * Calculated result from wordle matrix
 */
interface CalcResult {
  finalScore: number;
}

/**
 * Calculate score
 * @param wordle - array of numbers representing scores for each square
 * @returns CalcResult
 */
export function calculateScoreFromWordleMatrix(wordle: number[]): CalcResult {
  const solvedRowBonus = getPointBonus(wordle.length / 5);
  const score = wordle.map((element, index) => {
    return element * getMultiplier(index);
  }).reduce((previous, current) => {
    return previous + current;
  });
  return { finalScore: score + solvedRowBonus };
}