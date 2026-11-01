/**
 * Buckets and active cell tracking for spatial hashing grid
 */
export const collisions = {};
export const activeCells = new Set();
/**
 * Initializes or resets the collision grid based on divisions
 */
export function setupCollisionGrid(horizontalDivisions, verticalDivisions) {
    for (let i = 0; i < horizontalDivisions; i++) {
        for (let j = 0; j < verticalDivisions; j++) {
            const cellId = `${i}-${j}`;
            collisions[cellId] = [];
        }
    }
    activeCells.clear();
}
