import logger from './logger';

function logConsole(...args: any[]) {
  const prefix = (new Date()).toUTCString() + ' | ';
  console.log(prefix, ...args);
  if(logger && logger.log) {
    logger.log(prefix, ...args);
  }
}

export default logConsole;