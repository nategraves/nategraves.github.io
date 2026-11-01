// Utility functions
/**
 * Logs a message and optional data if debug mode is active
 */
export function log(message, data) {
    // `debug` is expected to be a global boolean in the main script
    // eslint-disable-next-line no-undef
    if (data !== undefined) {
        console.log(message, data);
    }
    else {
        console.log(message);
    }
}
/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Returns the magnitude (length) of a 2D vector
 */
export function magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
/**
 * Computes grid cell ID given x/y and global divisions
 */
export function getGridCell(x, y, width, height, horizontalDivs, verticalDivs) {
    const cellWidth = width / horizontalDivs;
    const cellHeight = height / verticalDivs;
    const i = Math.floor(x / cellWidth);
    const j = Math.floor(y / cellHeight);
    return `${i}-${j}`;
}
