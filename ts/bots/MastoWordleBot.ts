import type { mastodon } from 'masto';
import isValidWordle from '../../js/calculate/is-valid-wordle.js';
import { getSolvedRow } from '../../js/calculate/get-solved-row.js';
import { getWordleNumberFromList } from '../../js/extract/get-wordle-number-from-text.js';
import { calculateScoreFromWordleMatrix } from '../../js/calculate/calculate-score-from-wordle-matrix.js';
import type WordleData from '../../js/WordleData.js';
import checkIsSameDay from '../../js/is-same-day.js';
import getWordleMatrixFromList from '../../js/extract/get-wordle-matrix-from-list.js';
import getScorerGlobalStats from '../../js/db/get-scorer-global-stats.js';
import { getSentenceSuffix } from '../../js/display/get-sentence-suffix.js';
import logError from '../../js/debug/log-error.js';
import type { SearchIndex } from 'algoliasearch';
import WordleSource from '../enum/WordleSource.js';
import { JSDOM } from 'jsdom';
import logConsole from '../../js/debug/log-console.js';
import { getCompliment } from '../../js/display/get-compliment.js';

//FINAL TODOs: add env variables to prevent write, compile, npm start

const IS_DEVELOPMENT = process.env['NODE_ENV'] === 'develop';
const BOT_ID = '109338521888714827';
const ALLOW_LIST = new Set<String>(['@shaneafsar@mastodon.online', '@bbhart@noc.social']);
const SINCE_ID = 'since_id';

interface ProccessOptions {
  isGrowth: boolean;
  isParent: boolean;
};

interface GlobalScore {
  wordleNumber?: number;
  wordleScore?: number;
  solvedRow?: number;
  url?: string;
  userId?: string;
  screenName?: string;
  source: WordleSource
}

interface AlgoliaIndexObject {
  name?: string;
  score: number;
  solvedRow: number;
  wordleNumber: number;
  date_timestamp: number;
  url: string;
  autoScore: boolean;
  scorerName: string;
  photoUrl: string;
  source: WordleSource
}

interface WordleInfo {
  wordleScore: number;
  wordleNumber: number;
  solvedRow: number;
}

interface PostInfo {
  postId: string;
  url: string;
  createdAt: string;
}

interface AuthorInfo {
  userId: string;
  screenName: string;
  photo: string;
}

function getAltTextList(medias: mastodon.v1.MediaAttachment[]): string[] {
  return medias.map(media => {
      return media.description || '';
  })
}

export default class MastoWordleBot {
  private masto: mastodon.Client;
  private AlgoliaIndex: SearchIndex;
  private globalScores: WordleData;
  private userGrowth: WordleData;
  private analyzedPosts: WordleData;
  private users: WordleData;
  private lastMention: WordleData;
  private topScores: WordleData;

  private PROCESSING: Set<String> = new Set<String>();

  constructor(masto: mastodon.Client,
    algoliaIndex: SearchIndex, 
    globalScores: WordleData, 
    topScores: WordleData,
    userGrowth: WordleData,
    analyzedPosts: WordleData,
    users: WordleData,
    lastMention: WordleData) {
    this.masto = masto;
    this.AlgoliaIndex = algoliaIndex;
    this.globalScores = globalScores;
    this.topScores = topScores;
    this.userGrowth = userGrowth;
    this.analyzedPosts = analyzedPosts;
    this.users = users;
    this.lastMention = lastMention;
  }

  async initialize() {
    const [userTimeline, tagTimeline] = await Promise.all([
      this.masto.v1.stream.streamUser(), 
      this.masto.v1.stream.streamTagTimeline('Wordle')
    ]);
  
    await this.processRecentMentions();

    // TEMP: add followers to allowlist
    const followers = await this.masto.v1.accounts.listFollowers(BOT_ID);
    followers.forEach(follower => ALLOW_LIST.add(`@${follower.acct}`));

    // Add handlers
    tagTimeline.on('update', this.handleUpdate.bind(this));
    userTimeline.on('notification', this.handleNotification.bind(this));

  }

  /**
   * Used to fetch most recent mentions and process eligible posts.
   * Useful for cold starts or catching up after (un)expected downtime.
   */
  private async processRecentMentions() {
    let lastNotifId = this.lastMention.readSync(SINCE_ID) as string || null;
    const notifs = await this.masto.v1.notifications.list({ limit: 100, sinceId: lastNotifId });

    for(const notif of notifs) {
      // If newer, then save as last mention id. iF non existent, then add it.
      if(lastNotifId !== null && notif.id.localeCompare(lastNotifId) > 0){
        this.lastMention.write(SINCE_ID, notif.id);
      } else if (!lastNotifId) {
        lastNotifId = notif.id;
        this.lastMention.write(SINCE_ID, notif.id);
      }
      if(notif.type === 'mention' && notif.status !== null && notif.status !== undefined) {
        this.processPost(notif.status, {isGrowth: false, isParent: false});
      }
    }
  }

  /**
   * Saves valid wordle results into daily global 
   * Per sever rules, no random "growth" related replies will be made here like
   * in the twitter version of the bot. This will only reply if the bot is followed explicitly
   * by the hashtagged update.
   * @param status received status from stream
   */
  private async handleUpdate(status: mastodon.v1.Status) {

    const relationships = await this.masto.v1.accounts.fetchRelationships([status.account.id]);
    // There should only ever be 1 here, but api returns as array
    let isFollowingBot = relationships[0]?.followedBy || false;
    logConsole('isFollowing Masto bot? ', isFollowingBot , ' | ', status.account.acct);
    if(isFollowingBot) {

      this.processPost(status, {isGrowth: false, isParent: false});

    } else {

      const textContent = this.getWordleText(status.content) || '';
      const altTexts = getAltTextList(status.mediaAttachments);
      const listOfContent = [textContent, ...altTexts];
      const wordleMatrix = getWordleMatrixFromList(listOfContent);
      // Add domain for local users
      const userId = status.account.acct.indexOf('@') > -1 ? status.account.acct : status.account.acct+'@botsin.space'; 
      const screenName = '@' + status.account.acct;
      const url = status.url || '';
      const wordleNumber = getWordleNumberFromList(listOfContent);
      const solvedRow = getSolvedRow(wordleMatrix);

    

      if (isValidWordle(wordleMatrix, wordleNumber, solvedRow)) {

        const wordleScore = calculateScoreFromWordleMatrix(wordleMatrix).finalScore;

        const scoreObj:GlobalScore = {
          wordleNumber,
          wordleScore,
          solvedRow,
          url,
          userId,
          screenName,
          source: WordleSource.Mastodon
        };

        this.globalScores.write(userId, scoreObj);
      }
    }
  }

  private async handleNotification(notification: mastodon.v1.Notification) {
    if(notification.type === 'follow') {
      ALLOW_LIST.add(`@${notification.account.acct}`);
      this.masto.v1.accounts.follow(notification.account.id, {
        reblogs: false
      });
    }

    if (notification.type === 'mention' && notification.status) {
      this.lastMention.write(SINCE_ID, notification.id);

      this.processPost(notification.status, { isGrowth: false, isParent: false});
    }
  }

  private getWordleText(content: string) {
    const dom = new JSDOM(content);
    return dom.window.document.body.textContent;
  }

  private buildStatus(name: string, wordlePrefix: string, score: number, solvedRow: number, aboveTotal: string, isGrowth: boolean) {
    return `${name} This ${wordlePrefix} scored ${score} out of 360${getSentenceSuffix(solvedRow)} ${aboveTotal} ${getCompliment(isGrowth)}`;
  }

  private addToIndex(objectToIndex: AlgoliaIndexObject) {
    if(!IS_DEVELOPMENT) {
        this.AlgoliaIndex.saveObjects([objectToIndex], { autoGenerateObjectIDIfNotExist: true })
        .catch((e) => {
            logError('MastoBot | Algolia saveObjects error | ', e);
        });
    }
  }

  private async addToIndices(
    { wordleScore, wordleNumber, solvedRow } : WordleInfo,
    { userId, screenName, photo } : AuthorInfo,
    { url, postId }: PostInfo,
    { isGrowth }: ProccessOptions) {

    const analyzedPost = {
        score: wordleScore,
        solvedRow,
        wordleNumber,
        date_timestamp: Math.floor(Date.now() / 1000),
        url,
        autoScore: isGrowth,
        scorerName: screenName,
        source: WordleSource.Mastodon
    };

    await this.analyzedPosts.write(postId, analyzedPost);

    if(photo && userId) {
        this.users.write(userId, {
            user_id: userId,
            screen_name: screenName,
            photo: photo
        });
    }
  
    this.addToIndex({
        ...analyzedPost,
        photoUrl: photo || 'https://cdn.mastodon.online/avatars/original/missing.png'
    });
  }

  private async writeScoresToDB(
    { wordleScore, wordleNumber, solvedRow} : WordleInfo,
    { userId, screenName } : AuthorInfo,
    { url, createdAt }: PostInfo,
    { isGrowth }: ProccessOptions) {

    const createdAtDate = new Date(createdAt);
    const createdAtMs = createdAtDate.getTime();
    const isSameDay = checkIsSameDay(createdAtDate);  

     const scoreObj:GlobalScore = {
       screenName,
       wordleNumber,
       wordleScore,
       solvedRow,
       url,
       userId,
       source: WordleSource.Mastodon
     };

     this.globalScores.write(userId, scoreObj);

     /**
      * Add to today's scores if tweet happened today
      * Only allow one score per user
      */
     if(isSameDay) {
       this.topScores.write(userId, {
           screenName,
           wordleNumber,
           score: wordleScore,
           solvedRow,
           datetime: createdAtMs,
           autoScore: isGrowth,
           url,
           source: WordleSource.Mastodon
       });
     }
  }

  private async replyWordleScore(
    { wordleScore, wordleNumber, solvedRow} : WordleInfo,
    { screenName } : AuthorInfo,
    { postId }: PostInfo,
    { isGrowth }: ProccessOptions) {
    try {
      const { wordlePrefix, aboveTotal } = await getScorerGlobalStats({solvedRow, wordleNumber, date: new Date()}, this.globalScores);
      const status = this.buildStatus(screenName, wordlePrefix, wordleScore, solvedRow, aboveTotal, isGrowth);

      const shouldPostRealStatus = !IS_DEVELOPMENT || (IS_DEVELOPMENT && ALLOW_LIST.has(screenName));

      if(shouldPostRealStatus) {
        await this.masto.v1.statuses.create({ 
          status,
          inReplyToId: postId 
        });
        logConsole(`MastoBot | ${IS_DEVELOPMENT ? 'DEVMODE' : ''} reply to ${postId}: ${status}`);
      }

    } catch(e) {
        logError('MastoBot | failed to get globalScorerGlobalStats & reply | ', e);
    } finally {
        this.PROCESSING.delete(postId);
    }
  }

  private async processPost(status: mastodon.v1.Status, options: ProccessOptions) {
    const { isGrowth, isParent } = options;
    const url = status.url || '';
    const textContent = this.getWordleText(status.content) || '';
    const altTexts = getAltTextList(status.mediaAttachments);
    const listOfContent = [textContent, ...altTexts];
    const wordleMatrix = getWordleMatrixFromList(listOfContent);
    const parentId = status.inReplyToId || '';
    const userId = status.account.acct; //status.account.id;
    const screenName = '@' + status.account.acct;
    const postId = status.id;
    const photo = status.account.avatar;
    const wordleNumber = getWordleNumberFromList(listOfContent);
    const solvedRow = getSolvedRow(wordleMatrix);
    
    this.userGrowth.write(userId, { lastCheckTime: Date.now()});

    /**
     * Bail early if this post has been processed or is 
     * processing.
     */  
    if(this.analyzedPosts.readSync(postId) || this.PROCESSING.has(postId)) {
      return;
    }

    this.PROCESSING.add(postId);

    const isValid = isValidWordle(wordleMatrix, wordleNumber, solvedRow);
    logConsole(`${postId} | ${screenName} isValidWordle? `, isValid, 
      ' | wordleMatrix: ', wordleMatrix, ' | wordle number: ', wordleNumber, '| solvedRow: ', solvedRow);

    if (isValid) {

      const wordleInfo: WordleInfo = {
        wordleScore: calculateScoreFromWordleMatrix(wordleMatrix).finalScore,
        wordleNumber,
        solvedRow
      };

      const postInfo: PostInfo = {
        postId,
        url,
        createdAt: status.createdAt
      }

      const authorInfo: AuthorInfo = {
        screenName,
        userId,
        photo
      };

      this.writeScoresToDB(wordleInfo, authorInfo, postInfo, options);

      this.addToIndices(wordleInfo, authorInfo, postInfo, options);

      this.replyWordleScore(wordleInfo, authorInfo, postInfo, options);

    } else if(
      parentId && 
      !isGrowth &&
      !isParent && 
      !this.analyzedPosts.hasKey(parentId) &&
      !this.PROCESSING.has(parentId)) {
        
      try {
        const context = await this.masto.v1.statuses.fetchContext(status.id);
        if(context.ancestors.length > 0) {
          this.processPost(context.ancestors.pop()!, { isGrowth: false, isParent: true});
        } else {
          logError('unable to retreive parent status | ', context);
        }
      } catch (e) {
        logError('error finding parent post, request failed | ', e);
      } finally {
        this.PROCESSING.delete(postId);
      }

    }
  }
}