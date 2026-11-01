import { GameObject } from '../types';
import { getGridCell } from '../utils';
import { collisions, activeCells } from '../grid/collisionGrid';

/**
 * Moves objects, handles wall bounces, and updates their spatial hash cell.
 */
export function updateObjectPositions(
  gameObjects: GameObject[],
  width: number,
  height: number,
  horizontalDivs: number,
  verticalDivs: number
): void {
  for (const obj of gameObjects) {
    if (!obj || !obj.alive) continue;
    obj.x += obj.vx;
    obj.y += obj.vy;

    // bounce off walls
    if (obj.x < obj.size || obj.x > width - obj.size) obj.vx *= -1;
    if (obj.y < obj.size || obj.y > height - obj.size) obj.vy *= -1;

    const newCell = getGridCell(obj.x, obj.y, width, height, horizontalDivs, verticalDivs);
    if (newCell !== obj.cellId) {
      // remove from old
      const old = obj.cellId;
      if (old && collisions[old]) {
        const idx = collisions[old].indexOf(obj);
        if (idx > -1) {
          collisions[old].splice(idx, 1);
          if (collisions[old].length === 0) activeCells.delete(old);
        }
      }
      // add to new
      collisions[newCell].push(obj);
      activeCells.add(newCell);
      obj.cellId = newCell;
    }
  }
}
