import COMPLIMENTS from '../const/COMPLIMENTS.js';

/**
 * Returns a compliment.
 * TODO: Consider adjusting to different ones based on score?
 * @param {boolean} [isGrowthTweet]
 * @returns {string} a compliment :)
 */
export function getCompliment(isGrowthTweet: boolean): string {
  const length: number = COMPLIMENTS.length;
  return COMPLIMENTS[Math.floor(Math.random() * length)] + (isGrowthTweet ? ' Mention me in the future, I <3 wordles!' : '');
}