/**
 * Draws a semicircular shield between the player and mouse when shift is held
 */
export function drawShield(ctx, player, inputState) {
    if (!player.alive || !inputState.shift)
        return;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(inputState.mouseX, inputState.mouseY);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(inputState.mouseX, inputState.mouseY, 50, 0, Math.PI);
    ctx.stroke();
    ctx.closePath();
}
