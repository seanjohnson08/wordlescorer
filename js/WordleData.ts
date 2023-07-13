// @ts-nocheck
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs';
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import logger from './debug/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

function makeDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

class WordleData {
  /**
   * Create an instance of a WordleData
   * @param {string} name 
   * @param {string} [subdir] 
   */
  constructor(name: string, subdir?: string) {
    const directory = join(__dirname, '..','..', 'db', subdir ? `${subdir}` : '');
    if(subdir) {
      makeDir(directory);
    }
    const file = join(directory, `db.${name}.json`);
    this.file = file;
    const adapter = new JSONFile(file);
    this.db = new Low(adapter);
  }

  /**
   * Helper method for initializing a WordleData in a subdir, files partitioned by date.
   * @param {string} name - "table" name
   * @param {Date} [date] - append date to "table" name. Defaults to current date.
   * @returns new WordleData instance
   */
  static init(name: string, date?: Date) {
    if(!date) {
      date = new Date();
    }
    return new WordleData(`${name}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCFullYear()}`, name);
  }

  /**
   * Async method -- will always load data if not available
   * @param {string|null} [key] key of data to return. if null, returns all data if available.
   * @returns {Promise<any>}
   */
  async read(key?: string) {
    await this.loadData();

    if(key) {
      return this.db.data?.[key];
    }
    return this.db.data || {};
  }

  /**
   * Sync method. Expects data to have already been read.
   * @param {string} key key of data to return. if null, returns all data if available.
   * @returns 
   */
  readSync(key?: string) {
    if(key) {
      return this.db.data?.[key];
    }
    return this.db.data || {};
  }

  /**
   * @param {string} key
   * @param {any} data - push into array
   */
  async push(key: string, data: any) {
    await this.loadData();

    if(!this.db.data?.[key]) {
      this.db.data[key] = [];
    }

    /**
     * If possible, add epoch time
     */
    if(typeof data === 'object' &&
      !Array.isArray(data) &&
      data !== null &&
      !data.datetime) {
      data.datetime = Date.now();
    }

    this.db.data[key].push(data);

    await this.db.write().catch(e => {
      console.log('WordleData | push | ', this.file, ' | ', e);
      logger.error('WordleData | push | ', this.file, ' | ', e);
    });
  }

  /**
   * @param {string} key
   * @param {any} data
   */
  async write(key: string, data: any) {
    await this.loadData();

    /**
     * If possible, add epoch time
     */
    if(typeof data === 'object' &&
      !Array.isArray(data) &&
      data !== null &&
      !data.datetime) {
      data.datetime = Date.now();
    }

    if(!this.db.data) {
      this.db.data = { [key] : data};
    }
    else {
      this.db.data[key] = data;
    }

    await this.db.write().catch(e => {
      console.log('WordleData | write | ', this.file, ' | ', e);
      logger.error('WordleData | write | ', this.file, ' | ', e);
    });
  }

 /**
   * Synchronous method which returns the existance of a key
   * @param {string} key
   * @returns {boolean} true if key exists in data
   */
  hasKey(key: string) {
    if(this.db.data === null) {
      throw 'WordleData: hasKey requires db.loadData() to have been called';
    }
    return !!this.db.data[key];
  }

  async loadData() {
    if(this.db.data === null) {
      try {
        await this.db.read();
        if(this.db.data === null) {
          this.db.data = {};
        }
      } catch (e) {
        console.error(e);
      }
    }
    return Promise.resolve();
  }
};

export default WordleData;
