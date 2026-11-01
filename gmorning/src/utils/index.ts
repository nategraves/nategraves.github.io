// Utility functions

/**
 * Logs a message and optional data if debug mode is active
 */
export function log(message: string, data?: any) {
  // `debug` is expected to be a global boolean in the main script
  // eslint-disable-next-line no-undef
  if (data !== undefined) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the magnitude (length) of a 2D vector
 */
export function magnitude(vector: { x: number; y: number }): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/**
 * Computes grid cell ID given x/y and global divisions
 */
export function getGridCell(
  x: number,
  y: number,
  width: number,
  height: number,
  horizontalDivs: number,
  verticalDivs: number
): string {
  const cellWidth = width / horizontalDivs;
  const cellHeight = height / verticalDivs;
  let i = Math.floor(x / cellWidth);
  let j = Math.floor(y / cellHeight);
  i = Math.min(Math.max(i, 0), horizontalDivs - 1);
  j = Math.min(Math.max(j, 0), verticalDivs - 1);
  return `${i}-${j}`;
}
