import { collisions, activeCells } from '../grid/collisionGrid';
import { log } from '../utils';
/**
 * Iterates active grid cells to detect and resolve collisions between objects
 */
export function checkCollisions() {
    var _a;
    for (const cellId of activeCells) {
        const cellObjects = collisions[cellId];
        if (!cellObjects || cellObjects.length === 0)
            continue;
        for (let i = 0; i < cellObjects.length; i++) {
            const objA = cellObjects[i];
            for (let j = i + 1; j < cellObjects.length; j++) {
                const objB = cellObjects[j];
                if (!objB || objA === objB)
                    continue;
                const dx = objA.x - objB.x;
                const dy = objA.y - objB.y;
                const distSq = dx * dx + dy * dy;
                const minDist = objA.size + objB.size;
                if (distSq > minDist * minDist)
                    continue;
                // Collision detected
                if (objA.dieOnCollision)
                    objA.alive = false;
                if (objB.dieOnCollision)
                    objB.alive = false;
                if (objA.id === 'player' || objB.id === 'player') {
                    const playerObj = objA.id === 'player' ? objA : objB;
                    playerObj.score = ((_a = playerObj.score) !== null && _a !== void 0 ? _a : 0) + 1;
                    log('Player score increased', { score: playerObj.score });
                }
                // Handle bounce response
                const angle = Math.atan2(dy, dx);
                const speedA = Math.hypot(objA.vx, objA.vy);
                const speedB = Math.hypot(objB.vx, objB.vy);
                if (!objA.dieOnCollision) {
                    objA.vx = speedA * Math.cos(angle);
                    objA.vy = speedA * Math.sin(angle);
                }
                if (!objB.dieOnCollision) {
                    objB.vx = speedB * Math.cos(angle + Math.PI);
                    objB.vy = speedB * Math.sin(angle + Math.PI);
                }
            }
        }
    }
}
