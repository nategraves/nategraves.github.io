import { collisions, activeCells } from '../grid/collisionGrid';
import { getGridCell, randomInt } from '../utils';
/** Handles click events to spawn or control objects */
export function handleClick(event, isRightClick = false, player, gameObjects, inputState, width, height, sizeMin, sizeMax) {
    const { clientX: x, clientY: y } = event;
    if (gameObjects.length === 0) {
        player.x = x;
        player.y = y;
        player.alive = true;
        gameObjects.push(player);
        const cellId = getGridCell(player.x, player.y, width, height, Math.ceil(width / sizeMin), Math.ceil(height / sizeMin));
        collisions[cellId].push(player);
        player.cellId = cellId;
        activeCells.add(cellId);
        return;
    }
    const vector = { x: inputState.mouseX - player.x, y: inputState.mouseY - player.y };
    const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    const normalized = { x: vector.x / mag, y: vector.y / mag };
    const vx = normalized.x * 4;
    const vy = normalized.y * 4;
    const id = gameObjects.length;
    const size = randomInt(sizeMin, sizeMax);
    const offset = size + player.size / 2;
    const newObj = {
        id,
        x: player.x + (vx > 0 ? offset : -offset),
        y: player.y + (vy > 0 ? offset : -offset),
        vx,
        vy,
        size,
        dieOnCollision: true,
        alive: true,
        dob: Date.now(),
        score: 0,
        color: isRightClick ? 'blue' : 'red',
    };
    gameObjects.push(newObj);
    const cellId = getGridCell(newObj.x, newObj.y, width, height, Math.ceil(width / sizeMin), Math.ceil(height / sizeMin));
    collisions[cellId].push(newObj);
    activeCells.add(cellId);
    newObj.cellId = cellId;
}
/** Tracks mouse movement */
export function handleMouseMove(event, inputState) {
    inputState.mouseX = event.clientX;
    inputState.mouseY = event.clientY;
}
