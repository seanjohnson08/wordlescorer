// @ts-nocheck
import getPercent from  './get-percent.js';

const formatter: (value: number) => string = new Intl.NumberFormat().format;

interface WordleScoreStats {
  total: number;
  key: string;
  solvedRowCounts: number[];
}

/**
 * @param {number} rowIndex
 * @param {number} solvedRowCount
 * @param {number} total
 */
function formatStatement(rowIndex: number, solvedRowCount: number, total: number): string {
  let prefix: string = rowIndex > 5? 'Not solved:' : `Row ${rowIndex+1}:`;
  return `\n ${prefix} ${formatter(solvedRowCount)} (${getPercent(solvedRowCount, total)})`;
}

/**
 * @param {WordleScoreStats[]} stats - output from getGlobalStats
 * @returns {String[]} - array of tweets to send out
 */
function getFormattedGlobalStats(stats: WordleScoreStats[]): string[] {
 var tweets: string[] = [];
  
 // Ensure that the stats are sorted by total users descending order 
 var sortedStats: WordleScoreStats[] = [...stats].sort((a, b) => b.total - a.total);
  
 for (var i = 0; i < sortedStats.length; i++) {
  var statsRow: WordleScoreStats = sortedStats[i];
  var total: number = statsRow.total;
  var sortedRowCounts: number[] = statsRow.solvedRowCounts.slice(1);
  // Push not solved to end of array
  sortedRowCounts.push(statsRow.solvedRowCounts[0]);
   

  var statement: string = `In the last 24 hours for #Wordle ${statsRow.key}, I found ${formatter(total)} unique users with the following distribution:`
   
  for (var j = 0; j < sortedRowCounts.length; j++) {
    statement += formatStatement(j, sortedRowCounts[j], total);
  }
   
  tweets.push(statement);
   
  }

  return tweets;
};

export default getFormattedGlobalStats;