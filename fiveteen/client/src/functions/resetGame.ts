import type { PlayerState } from "../types/index.js";
import { calculateStartingPositions } from "./calculateStartingPositions.js";

export function resetGame(
  players: PlayerState[],
  canvasWidth: number,
  canvasHeight: number
): void {
  players.forEach((player) => {
    player.ratioX = Math.random();
    player.ratioY = Math.random();
    player.team = 0; // Reset to default team
    player.wetnessLevel = 0; // Reset wetness
    player.wetnessColor = "white"; // Reset wetness color
  });

  calculateStartingPositions(players, canvasWidth, canvasHeight);
}
