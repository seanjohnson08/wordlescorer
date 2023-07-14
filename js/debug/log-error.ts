import logger from './logger.js';

function logError(...args: any[]) {
  const prefix = (new Date()).toUTCString() + ' | ';
  console.error(prefix, ...args);
  if(logger && logger.error) {
    logger.error(prefix, ...args);
  }
}

export default logError;