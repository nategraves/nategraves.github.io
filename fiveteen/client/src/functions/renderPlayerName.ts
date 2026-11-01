import type { PlayerState } from "../types/index.js";
import { TEAM_HEX_COLORS, PLAYER_NAME_FONT, PLAYER_NAME_OFFSET_Y, PLAYER_RADIUS } from "../constants/index.js";

export function renderPlayerName(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  cx: number,
  cy: number
): void {
  ctx.fillStyle = TEAM_HEX_COLORS[player.team] || "#000";
  ctx.font = PLAYER_NAME_FONT;
  ctx.textAlign = "center";
  ctx.fillText(
    player.playerName.substring(0, 8),
    cx,
    cy + PLAYER_RADIUS + PLAYER_NAME_OFFSET_Y + 4
  );
}
