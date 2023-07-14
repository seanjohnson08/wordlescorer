import WordleData from '../WordleData.js';

/**
 * @param {Date | undefined} [date]
 */
function getTopScoreDB(date: Date | undefined): WordleData {
  return WordleData.init('top-scores', date);
}

export default getTopScoreDB;