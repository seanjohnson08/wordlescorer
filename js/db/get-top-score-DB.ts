import WordleData from '../WordleData.js';

/**
 * @param {Date | undefined} [date]
 * @returns {Promise<WordleData>}
 */
function getTopScoreDB(date?: Date): Promise<WordleData> {
  return WordleData.init('top-scores', date);
}

export default getTopScoreDB;