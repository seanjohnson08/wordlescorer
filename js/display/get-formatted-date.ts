// @ts-nocheck
/**
 * 
 * @param {Date} date 
 * @returns {string}
 */
export function getFormattedDate(date: Date): string {
  let options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  options.timeZone = 'UTC';
  options.timeZoneName = 'short';

  return date.toLocaleString('en-US', options);
}