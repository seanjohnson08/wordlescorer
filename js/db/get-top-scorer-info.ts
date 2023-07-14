// @ts-nocheck
import getGlobalStats from './get-global-stats.js';
import getTopScoreDB from './get-top-score-DB.js';
import getPercent from '../display/get-percent.js';

const formatter = new Intl.NumberFormat().format;

async function getTopScorerInfo(date: string) {
  const TopScoreDB = getTopScoreDB(date);
  const globalStats = await getGlobalStats(date).catch((err: Error) => {
    console.error(err);
  });
  /**
   * {
   *   userid: 
   *    {
   *      name
   *      score
   *      solvedRow
   *      datetime
   *      wordleNumber
   *    }
   * }
   */
  let data = await TopScoreDB.read().catch((err: Error) => {
    console.error(err);
  });
  let scorerList = Object.values(data);
  // Select the most likely wordle that we care about today, filter to those people
  if (globalStats.length > 1) {
    
    let globalStat = globalStats?.[0].total < globalStats?.[1].total ? globalStats[1] : globalStats[0];
    // filter scorerList to items with wordleNumber that have globalStat.key
    scorerList = scorerList.filter((scorer) => {
      return globalStat.key === scorer.wordleNumber+'';
    });

    const solvedRowCounts =  globalStat.solvedRowCounts.slice(0);
    solvedRowCounts.push(globalStat.solvedRowCounts[0]);
    const globalStatsTotal = globalStat.total;

    scorerList.forEach((scorer: any) => {
      scorer.aboveTotal = 0;
      // If it's not solved, the row is 0
      if(scorer.solvedRow !== 0) {
        let iteratorStart = scorer.solvedRow + 1;
        for(let i = iteratorStart; i < solvedRowCounts.length; i++) {
          scorer.aboveTotal += solvedRowCounts[i];
        }
      }
      scorer.percentage = getPercent(scorer.aboveTotal, globalStatsTotal);
      scorer.aboveTotal = formatter(scorer.aboveTotal);
    });
  }
  /**
   * Compare by score, then solved row, then date
   */
  scorerList.sort(function(a: any, b: any) {
    if (a.score === b.score) {
      if(a.solvedRow === b.solvedRow) {
        return a.datetime - b.datetime;
      }
      return a.solvedRow - b.solvedRow;
    } else if(a.score > b.score) {
        return -1;
    } else if(a.score < b.score) {
        return 1;
    }
   });
  
  return scorerList?.[0] || null;
}

export default getTopScorerInfo;