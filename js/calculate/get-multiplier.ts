/**
 * Provides a multiplier for a block based on which row it appeared in.
 * @param {number} currentIndex 
 * @returns {number}
 */
function getMultiplier(currentIndex: number): number {
    let multiplier: number = 1;
    if (currentIndex <= 4) {
        multiplier = 6;
    } else if (currentIndex <= 9) {
        multiplier = 5;
    } else if (currentIndex <= 14) {
        multiplier = 4;
    } else if (currentIndex <= 19) {
        multiplier = 3;
    } else if (currentIndex <= 24) {
        multiplier = 2;
    }
    return multiplier;
}

export default getMultiplier;