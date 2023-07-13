/**
 * 
 * @param {number[]} wordle array of numbers representing scores for each square
 * @param {number} [wordleNumber]
 * @param {number} [solvedRow]
 * @returns {boolean} true if array is a valid Wordle game
 */
function isValidWordle(wordle: number[], wordleNumber?: number, solvedRow?: number): boolean {

  if (wordle.length === 0 || wordle.length % 5 !== 0) {
    return false;
  }

  if(wordleNumber === 0) {
    return false;
  }

  if(typeof solvedRow !== 'undefined' && Number.isInteger(solvedRow)) {
    return solvedRow < 7;
  }
  return true;
}

export default isValidWordle;