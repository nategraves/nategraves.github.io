import type { PlayerState } from "../types/index.js";
import { PLAYER_RADIUS } from "../constants/index.js";

export function calculateStartingPositions(
  players: PlayerState[],
  canvasWidth: number,
  canvasHeight: number
): void {
  const buffer = 10; // Minimum distance between players
  const positions: { x: number; y: number }[] = [];

  players.forEach((player) => {
    let position: { x: number; y: number };
    let isOverlapping;

    do {
      position = {
        x: Math.random() * (canvasWidth - PLAYER_RADIUS * 2) + PLAYER_RADIUS,
        y: Math.random() * (canvasHeight - PLAYER_RADIUS * 2) + PLAYER_RADIUS,
      };

      isOverlapping = positions.some((existing) => {
        const dx = existing.x - position.x;
        const dy = existing.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS * 2 + buffer;
      });
    } while (isOverlapping);

    positions.push(position);
    player.ratioX = position.x / canvasWidth;
    player.ratioY = position.y / canvasHeight;
  });
}
