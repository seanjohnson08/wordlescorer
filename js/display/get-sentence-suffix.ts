/**
 * getSentenceSuffix
 * @param {number} solvedRowNum
 * @returns {string}
 */
export function getSentenceSuffix(solvedRowNum: number): string {
  if (solvedRowNum === 0) {
    return '.';
  }
  return `, solved on row ${solvedRowNum}.`;
}