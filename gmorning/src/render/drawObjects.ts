import { GameObject } from '../types';

/**
 * Renders all alive game objects as circles
 */
export function drawObjects(ctx: CanvasRenderingContext2D, gameObjects: GameObject[]): void {
  gameObjects.forEach((obj) => {
    if (!obj || !obj.alive) return;
    ctx.fillStyle = obj.color ?? 'black';
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
    ctx.fill();
  });
}
