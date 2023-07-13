// @ts-nocheck
import getPercent from  './get-percent.js';

const formatter = new Intl.NumberFormat().format;

/**
 * @param {number} rowIndex
 * @param {number} solvedRowCount
 * @param {number} total
 */
function formatStatement(rowIndex: number, solvedRowCount: number, total: number): string {
  let prefix = rowIndex > 5? 'Not solved:' : `Row ${rowIndex+1}:`;
  return `\n ${prefix} ${formatter(solvedRowCount)} (${getPercent(solvedRowCount, total)})`;
}

/**
 * @typedef {{total: number, key: number, solvedRowCounts: number[]}} WordleScoreStats
 * @param {WordleScoreStats[]} stats - output from getGlobalStats
 * @returns {String[]} - array of tweets to send out
 */
function getFormattedGlobalStats(stats: WordleScoreStats[]): string[] {
  const tweets: string[] = [];
  
  // Ensure that the stats are sorted by total users descending order 
  const sortedStats = [...stats].sort((a, b) => b.total - a.total);
  
  for (let i = 0; i < sortedStats.length; i++) {
    const statsRow = sortedStats[i];
    const total = statsRow.total;
    const sortedRowCounts = statsRow.solvedRowCounts.slice(1);
    // Push not solved to end of array
    sortedRowCounts.push(statsRow.solvedRowCounts[0]);
   

    let statement = `In the last 24 hours for #Wordle ${statsRow.key}, I found ${formatter(total)} unique users with the following distribution:`
   
    for (let j = 0; j < sortedRowCounts.length; j++) {
      statement += formatStatement(j, sortedRowCounts[j], total);
    }
   
    tweets.push(statement);
   
  }

  return tweets;
};

export default getFormattedGlobalStats;