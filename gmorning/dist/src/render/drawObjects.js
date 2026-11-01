/**
 * Renders all alive game objects as circles
 */
export function drawObjects(ctx, gameObjects) {
    gameObjects.forEach((obj) => {
        var _a;
        if (!obj || !obj.alive)
            return;
        ctx.fillStyle = (_a = obj.color) !== null && _a !== void 0 ? _a : 'black';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
