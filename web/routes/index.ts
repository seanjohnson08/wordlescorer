import express, { Request, Response, Router } from "express";
import WordleData from '../../js/WordleData.js';
import getGlobalStats from '../../js/db/get-global-stats.js';
import getTopScorerInfo from '../../js/db/get-top-scorer-info.js';
import getPercent from '../../js/display/get-percent.js';

const formatter = new Intl.NumberFormat().format;

const router: Router = express.Router();
/* GET home page. */
router.get('/', (_req: Request, res: Response) => {
  console.log('[web] loading data...');
  const currentDate: Date = new Date();
  const AnalyzedTweetsDB: WordleData = new WordleData('analyzed');
  AnalyzedTweetsDB.read().then((data: any) => {
    const values: any[] = Object.values(data);
    const keys: string[] = Object.keys(data);
    const screenNameHash: any = {};
    const renderData: any[] = values.map((item: any, index: number) => {
      item.datestring = (new Date(item.datetime)).toLocaleDateString("en-US");  
      item.id = keys[index];
      if(item.score) {
        screenNameHash[item.name] = { lastCheckTime: Date.now() };
      }
      // Only include highlights for dates after this time.
      if(item.datetime > 1666286675411) {
        item.isManual = !item.autoScore;
      }
      item.name = item.scorerName || item.name;
      return item;
    }).sort((a: any, b: any) => b.datetime - a.datetime);

  
    
    const renderDate: string = new Intl.DateTimeFormat("en-US", { 
        dateStyle: 'short', 
        timeStyle: 'long',
        timeZone: 'America/New_York'
    }).format(currentDate);

    Promise.all([
      getGlobalStats(currentDate), 
      getTopScorerInfo(currentDate)]).then((results: any[]) => {
      const stats: any[] = results[0];
      const topScorerInfo: any = results[1];
      // Add percents to each stat
      stats.forEach((item: any) => {
        item.solvedRowPercents = item.solvedRowCounts.map((row: number) => {
          return getPercent(row, item.total);
        });
        item.solvedRowCounts = item.solvedRowCounts.map((row: number) => {
          return formatter(row);
        });
        item.total = formatter(item.total);
      });

      const finalTime: number = new Date().setUTCHours(24,0,0,0);
      const currentTime: number = currentDate.getTime();
      const timeTillDailyTopScore: string = `Daily Top Score tweet happening in about ${((finalTime - currentTime)/1000/60/60).toFixed(2)} hours!`;

      //Render page
      res.render('index.pug', { 
        title: 'Score My Wordle',
        globalStats: stats,
        scoreMessage: timeTillDailyTopScore,
        topScorerInfo: topScorerInfo,
        //datalist: renderData,
        scoredCount: renderData.filter((item: any) => item.score).length,
        userCount: Object.keys(screenNameHash).length,
        lastUpdated: renderDate
      });
    });
  });
});
export default router;