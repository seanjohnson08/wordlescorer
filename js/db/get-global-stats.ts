// @ts-nocheck
import getGlobalScoreDB from './get-global-score-DB.js';

/**
 * @typedef {{total: number, key: number, solvedRowCounts: number[]}} WordleScoreStats
 * @param {Date} date datetime of global stats to pull 
 * @param {WordleData} [globalScoreDB] instance of globalScoreDB
 * @returns {Promise<WordleScoreStats[]>} Returns array of wordle stats
 */
async function getGlobalStats(date: Date, globalScoreDB?: WordleData): Promise<WordleScoreStats[]> {
  const GlobalScoreStatsDB: WordleData = globalScoreDB || getGlobalScoreDB(date);
  let data: Record<string, any> = await GlobalScoreStatsDB.read().catch((err: Error) => {
    console.error(err);
  });
  const scorerList: any[] = Object.values(data);
  const wordleScores: Record<string, WordleScoreStats> = {};
  
  scorerList.forEach((item: any) => {
    const key: string = item.wordleNumber.toString();
    const solvedRow: number = item.solvedRow;
    
    // Only allow valid wordles through
    if (solvedRow < 7) {
      if (wordleScores[key]) {
        wordleScores[key].total++;
      } else {
        wordleScores[key] = { 
          total: 1,
          key: parseInt(key),
          solvedRowCounts: [0, 0, 0, 0, 0, 0, 0]
        };
      }
      wordleScores[key].solvedRowCounts[solvedRow]++;
    }
  });

  // Sort by most popular
  const sortedWordleStats: WordleScoreStats[] = Object.values(wordleScores).sort((a, b) => b.total - a.total);

  // Sort by wordle key/number
  return sortedWordleStats.slice(0, 2).sort((a, b) => b.key - a.key);
}

export default getGlobalStats;
