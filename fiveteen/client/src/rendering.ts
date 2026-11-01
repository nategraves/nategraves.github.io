// Rendering module: Handles all canvas drawing logic

import * as constants from "./constants";
import type { GameState, PlayerState, BalloonState } from "./types";
import { hexToRgba } from "./functions/index"; // Corrected path to functions/index.ts

const {
  PLAYER_RADIUS,
  AIM_OFFSET,
  AIM_RADIUS,
  DEAD_ZONE,
  BALLOON_RADIUS,
  SCORE_FONT,
  MAX_WETNESS,
  LERP_FACTOR,
  UMBRELLA_WIDTH_PX,
  UMBRELLA_THICKNESS_PX,
  UMBRELLA_HANDLE_LENGTH_PX,
  UMBRELLA_HANDLE_THICKNESS_PX,
  BASE_UMBRELLA_OFFSET_Y_PX,
  PLAYER_NAME_FONT,
  PLAYER_NAME_OFFSET_Y,
  TEAM_HEX_COLORS,
  TEAM_DISPLAY_NAMES, // Added TEAM_DISPLAY_NAMES
} = constants;

let TEAM_DISPLAY_NAMES_RENDERING = [...TEAM_DISPLAY_NAMES]; // Mutable copy, initialized from constants

// Setup canvas
export const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement | null; // Added null type
export const ctx = canvas?.getContext("2d") ?? null; // Added null type and default

if (!canvas) {
  console.error("Failed to get canvas element with ID 'gameCanvas'");
} else {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

if (canvas) {
    window.addEventListener("resize", resizeCanvas);
}

// Client-side state for smooth rendering
const renderedPlayerPositions = new Map<string, { x: number; y: number }>();

export function renderGameState(state: GameState) {
  if (!ctx || !canvas) {
    console.error("Canvas context or canvas element is not available for rendering.");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const {
    players,
    balloons,
    teamScores,
    friendlyFireEnabled,
    gameOver,
    winningTeam,
    persistentPlayerStats,
    teamSessionWins,
    teamNames,
    // tilemap, // Not used in the provided rendering logic
  } = state;

  // Update team display names if provided by the server state
  if (teamNames && teamNames.length > 0) {
    TEAM_DISPLAY_NAMES_RENDERING = teamNames;
  }

  // Update team scores display in UI (moved from main.ts)
  const team0ScoreSpan = document.getElementById("team0score");
  const team1ScoreSpan = document.getElementById("team1score");
  const team0NameSpan = document.getElementById("team0name");
  const team1NameSpan = document.getElementById("team1name");

  if (
    team0ScoreSpan &&
    team1ScoreSpan &&
    teamScores &&
    team0NameSpan &&
    team1NameSpan &&
    TEAM_DISPLAY_NAMES_RENDERING.length > 1 && TEAM_HEX_COLORS.length > 1
  ) {
    team0NameSpan.textContent = TEAM_DISPLAY_NAMES_RENDERING[0];
    team0NameSpan.style.color = TEAM_HEX_COLORS[0];
    team0ScoreSpan.textContent = teamScores[0]?.toString() ?? '0';

    team1NameSpan.textContent = TEAM_DISPLAY_NAMES_RENDERING[1];
    team1NameSpan.style.color = TEAM_HEX_COLORS[1];
    team1ScoreSpan.textContent = teamScores[1]?.toString() ?? '0';
  }

  // Update Session Wins display in UI (moved from main.ts)
  const team0SessionWinsSpan = document.getElementById("team0sessionwins");
  const team1SessionWinsSpan = document.getElementById("team1sessionwins");
  const team0SessionNameSpan = document.getElementById("team0sessionname");
  const team1SessionNameSpan = document.getElementById("team1sessionname");

  if (
    team0SessionWinsSpan &&
    team1SessionWinsSpan &&
    teamSessionWins &&
    team0SessionNameSpan &&
    team1SessionNameSpan &&
    TEAM_DISPLAY_NAMES_RENDERING.length > 1 && TEAM_HEX_COLORS.length > 1
  ) {
    team0SessionNameSpan.textContent = TEAM_DISPLAY_NAMES_RENDERING[0];
    team0SessionNameSpan.style.color = TEAM_HEX_COLORS[0];
    team0SessionWinsSpan.textContent = teamSessionWins[0]?.toString() ?? '0';

    team1SessionNameSpan.textContent = TEAM_DISPLAY_NAMES_RENDERING[1];
    team1SessionNameSpan.style.color = TEAM_HEX_COLORS[1];
    team1SessionWinsSpan.textContent = teamSessionWins[1]?.toString() ?? '0';
  }

  // Update Friendly Fire status display in UI (moved from main.ts)
  const ffStatusSpan = document.getElementById("ffStatus");
  if (ffStatusSpan) {
    ffStatusSpan.textContent = friendlyFireEnabled ? "ON" : "OFF";
    ffStatusSpan.style.color = friendlyFireEnabled ? "green" : "red";
  }
  
  // Ensure restart button is removed if game is not over (UI logic, moved from main.ts)
  const existingRestartButton = document.getElementById("restartButton");
  if (existingRestartButton && !gameOver) {
      existingRestartButton.remove();
  }


  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = SCORE_FONT || "48px sans-serif";
    ctx.fillStyle = "#000"; // Use black for game over text
    ctx.textAlign = "center";
    const winnerText =
      winningTeam !== null && winningTeam >= 0 && winningTeam < TEAM_DISPLAY_NAMES_RENDERING.length
        ? `${TEAM_DISPLAY_NAMES_RENDERING[winningTeam]} Wins!`
        : "Game Over!";
    ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#ccc";
    ctx.fillText("Session Stats:", canvas.width / 2, canvas.height / 2 - 20);

    if (persistentPlayerStats && persistentPlayerStats.length > 0) {
      // Sort by conversions, then by gamesWon, then by fewer deaths
      const sortedStats = [...persistentPlayerStats].sort((a, b) => {
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        if (b.gamesWon !== a.gamesWon) {
          return b.gamesWon - a.gamesWon;
        }
        return a.deathsByConversion - b.deathsByConversion;
      });

      let statYPos = canvas.height / 2 + 10;
      ctx.textAlign = "left";
      const col1X = canvas.width / 2 - 150;
      const col2X = canvas.width / 2 + 0;
      const col3X = canvas.width / 2 + 70;
      const col4X = canvas.width / 2 + 140;

      ctx.fillStyle = "#000"; // Use black for stats header
      ctx.fillText("Player", col1X, statYPos);
      ctx.fillText("Conv", col2X, statYPos);
      ctx.fillText("Deaths", col3X, statYPos);
      ctx.fillText("Wins", col4X, statYPos);
      statYPos += 25;

      sortedStats.forEach((stats, index) => {
        if (index < 5) { // Display top 5
          const playerTeam = players.find((p) => p.playerName === stats.playerName)?.team ?? 0;
          ctx.fillStyle = TEAM_HEX_COLORS[playerTeam] || "#000"; // Player name in team color
          ctx.fillText(stats.playerName.substring(0, 8), col1X, statYPos); // Ensure name is not too long
          ctx.fillStyle = "#000"; // Use black for stats values
          ctx.fillText(stats.conversions.toString(), col2X, statYPos);
          ctx.fillText(stats.deathsByConversion.toString(), col3X, statYPos);
          ctx.fillText(stats.gamesWon.toString(), col4X, statYPos);
          statYPos += 20;
        }
      });
    } else {
      ctx.textAlign = "center";
      ctx.fillText("No persistent stats yet.", canvas.width / 2, canvas.height / 2 + 10);
    }

    ctx.textAlign = "center"; // Ensure text align is center for the message below
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#000"; // Use black for restart prompt
    ctx.fillText("Click Restart or wait for new players", canvas.width / 2, canvas.height / 2 + 130);
    // Restart button creation/management is now in ui.ts, so we don't return here.
    // The main game loop in main.ts will decide if it needs to stop calling renderGameState.
    // However, we should not draw players/balloons if game is over.
    return; 
  }

  balloons.forEach((b: BalloonState) => {
    ctx.fillStyle = b.teamColor;
    const bx = canvas.width / 2 + b.x * (canvas.width / 2);
    const by = canvas.height / 2 + b.y * (canvas.height / 2);
    const radius = BALLOON_RADIUS; // Constant size regardless of power
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, 2 * Math.PI);
    ctx.fill();
  });

  players.forEach((p: PlayerState) => { // Added type annotation
    const targetX = canvas.width / 2 + p.ratioX * (canvas.width / 2);
    const targetY = canvas.height / 2 + p.ratioY * (canvas.height / 2);

    let currentPos = renderedPlayerPositions.get(p.id);
    if (!currentPos) {
      currentPos = { x: targetX, y: targetY };
      renderedPlayerPositions.set(p.id, currentPos);
    }

    currentPos.x += (targetX - currentPos.x) * LERP_FACTOR;
    currentPos.y = targetY; // No lerping for vertical movement

    const cx = currentPos.x;
    const cy = currentPos.y;

    ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, PLAYER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    if (p.wetnessLevel > 0) {
      const progress = Math.min(p.wetnessLevel / MAX_WETNESS, 1);
      ctx.save();
      const clipHeight = progress * 2 * PLAYER_RADIUS;
      const clipX = cx - PLAYER_RADIUS;
      const clipY = cy + PLAYER_RADIUS - clipHeight;
      ctx.beginPath();
      ctx.rect(clipX, clipY, 2 * PLAYER_RADIUS, clipHeight);
      ctx.clip();

      let opposingTeamIndex = 0;
      if (state.teamNames && state.teamNames.length > 0) {
        opposingTeamIndex = (p.team + 1) % state.teamNames.length;
      } else {
        opposingTeamIndex = (p.team + 1) % 2; // Default to 2 teams
      }
      const wetnessEffectColorHex = TEAM_HEX_COLORS[opposingTeamIndex] || "#888888";
      ctx.fillStyle = hexToRgba(wetnessEffectColorHex, 0.75);
      ctx.beginPath();
      ctx.arc(cx, cy, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY);
    if (aimMagnitude > DEAD_ZONE && !p.isUmbrellaOpen) {
      const aimDrawX = cx + p.aimX * AIM_OFFSET;
      const aimDrawY = cy + p.aimY * AIM_OFFSET;
      ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000"; // Player's team color, opaque
      ctx.beginPath();
      ctx.arc(aimDrawX, aimDrawY, AIM_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (p.isUmbrellaOpen) {
      // Umbrella canopy (arc)
      ctx.beginPath();
      ctx.lineWidth = UMBRELLA_THICKNESS_PX;
      ctx.strokeStyle = TEAM_HEX_COLORS[p.team] || "#555"; // Use team color or fallback
      
      // Calculate angle for the umbrella
      const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY); // Calculate aimMagnitude here
      let angle;
      let actualUmbrellaOffsetX, actualUmbrellaOffsetY;
      let handleDirX, handleDirY; // Normalized direction for handle positioning relative to player center

      if (aimMagnitude <= DEAD_ZONE) {
        angle = -Math.PI / 2; // Umbrella arc points up

        // Position umbrella directly above player
        actualUmbrellaOffsetX = 0;
        actualUmbrellaOffsetY = -(PLAYER_RADIUS + BASE_UMBRELLA_OFFSET_Y_PX); // Y decreases upwards

        // Handle also points straight up from player center
        handleDirX = 0;
        handleDirY = -1;
      } else {
        angle = Math.atan2(p.aimY, p.aimX);

        // Umbrella offset scales with aim magnitude
        actualUmbrellaOffsetX = p.aimX * (PLAYER_RADIUS + BASE_UMBRELLA_OFFSET_Y_PX);
        actualUmbrellaOffsetY = p.aimY * (PLAYER_RADIUS + BASE_UMBRELLA_OFFSET_Y_PX);

        // Handle direction follows aim; if p.aimX/Y are not normalized, offsets will scale.
        // For consistency with how actualUmbrellaOffset is calculated, we use p.aimX/Y directly.
        handleDirX = p.aimX;
        handleDirY = p.aimY;
      }
      
      const spreadAngle = Math.PI * 0.8; // How wide the umbrella arc is (144 degrees, closer to a semi-circle)
      
      // Calculate the actual center of the umbrella arc
      const actualArcCenterX = cx + actualUmbrellaOffsetX;
      const actualArcCenterY = cy + actualUmbrellaOffsetY;
      
      const umbrellaArcDisplayRadius = UMBRELLA_WIDTH_PX / 2;

      // Draw the arc using actualArcCenter and calculated angle
      ctx.beginPath(); // Ensure a new path for the arc
      ctx.arc(actualArcCenterX, actualArcCenterY, umbrellaArcDisplayRadius, angle - spreadAngle / 2, angle + spreadAngle / 2);
      ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#555"; // Use team color for fill
      ctx.fill(); // Fill the arc

      // Umbrella handle
      ctx.beginPath(); // Ensure a new path for the handle
      ctx.lineWidth = UMBRELLA_HANDLE_THICKNESS_PX;
      ctx.strokeStyle = TEAM_HEX_COLORS[p.team] || "#333"; // Use team color or fallback
      
      // Handle starts offset from player center along handleDirX, handleDirY
      // The offset PLAYER_RADIUS * 0.5 scales with magnitude of handleDirX/Y if they are not normalized (e.g. p.aimX/Y)
      const handleStartX = cx + handleDirX * (PLAYER_RADIUS * 0.5); 
      const handleStartY = cy + handleDirY * (PLAYER_RADIUS * 0.5);
      
      // Determine normalized direction for extending beyond arc center
      let normExtendDirX, normExtendDirY;
      if (aimMagnitude <= DEAD_ZONE) {
        normExtendDirX = 0;
        normExtendDirY = -1; // Uses the already normalized handleDir for dead zone
      } else {
        // Ensure aimMagnitude is not zero to prevent NaN, though DEAD_ZONE check should largely cover it.
        if (aimMagnitude < 1e-6) { // A very small number to represent nearly zero
          normExtendDirX = 0; // Default if magnitude is practically zero (e.g. aimX & aimY are tiny)
          normExtendDirY = -1; // Point upwards in such an edge case
        } else {
          normExtendDirX = p.aimX / aimMagnitude;
          normExtendDirY = p.aimY / aimMagnitude;
        }
      }

      // Handle ends by extending from the canopy center by its radius, along the normalized direction.
      // This makes the handle appear to go through the center to the far edge of the canopy.
      const handleEndX = actualArcCenterX + normExtendDirX * umbrellaArcDisplayRadius;
      const handleEndY = actualArcCenterY + normExtendDirY * umbrellaArcDisplayRadius;
      
      ctx.moveTo(handleStartX, handleStartY);
      ctx.lineTo(handleEndX, handleEndY);
      ctx.stroke();
    }

    // Draw player name
    ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000"; // Player name in team color
    ctx.font = PLAYER_NAME_FONT;
    ctx.textAlign = "center";
    ctx.fillText(
      p.playerName.substring(0, 8),
      cx,
      cy + PLAYER_RADIUS + PLAYER_NAME_OFFSET_Y // Position name below player by defined offset
    );
  });
}
