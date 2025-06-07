// Simple WebSocket client for Fiveteen game with unique client fingerprint

// Generate a unique client ID
const clientId: string = `${Date.now()}-${Math.random()
  .toString(36)
  .substr(2, 9)}`;
console.log('Client ID:', clientId);

// Level definitions
const levels = [
  { id: 'level1', name: 'Level 1' },
  { id: 'level2', name: 'Level 2' }
];
let currentLevel = levels[0].id;

// Create UI overlay for level select and status
const uiDiv = document.createElement('div');
uiDiv.style.position = 'fixed';
uiDiv.style.top = '10px';
uiDiv.style.left = '10px';
uiDiv.style.zIndex = '100';
uiDiv.style.background = 'rgba(255,255,255,0.8)';
uiDiv.style.padding = '5px';
const levelSelect = document.createElement('select');
levels.forEach(l => {
  const opt = document.createElement('option'); opt.value = l.id; opt.text = l.name;
  levelSelect.appendChild(opt);
});
levelSelect.value = currentLevel;
uiDiv.appendChild(levelSelect);
const statusSpan = document.createElement('span');
statusSpan.textContent = 'Connecting...';
statusSpan.style.marginLeft = '10px';
uiDiv.appendChild(statusSpan);

// Added: Team scores display - updated to include spans for team names
const teamScoresDiv = document.createElement('div');
teamScoresDiv.style.marginTop = '5px';
teamScoresDiv.innerHTML = 'Game Scores: <span id="team0name">Team 1</span>: <span id="team0score" style="font-weight: bold;">0</span> - <span id="team1name">Team 2</span>: <span id="team1score" style="font-weight: bold;">0</span>';
uiDiv.appendChild(teamScoresDiv);

// Added: Session Wins Display - updated to include spans for team names
const sessionWinsDiv = document.createElement('div');
sessionWinsDiv.style.marginTop = '5px';
sessionWinsDiv.innerHTML = 'Session Wins: <span id="team0sessionname">Team 1</span>: <span id="team0sessionwins" style="font-weight: bold;">0</span> - <span id="team1sessionname">Team 2</span>: <span id="team1sessionwins" style="font-weight: bold;">0</span>';
uiDiv.appendChild(sessionWinsDiv);

// Added: Friendly Fire Status Display
const ffStatusDiv = document.createElement('div');
ffStatusDiv.style.marginTop = '5px';
ffStatusDiv.innerHTML = 'Friendly Fire: <span id="ffStatus">ON</span>';
uiDiv.appendChild(ffStatusDiv);

document.body.appendChild(uiDiv);

// Setup canvas
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);

// WebSocket with reconnection
let socket: WebSocket;
let reconnectAttempts = 0;
// Removed: let localPlayerName: string | null = null;
// Store player names per controllerId
const controllerPlayerNames = new Map<string, string>();

// clientId is defined at the top level of this script.

function getPlayerName(controllerId: string): string {
  if (controllerPlayerNames.has(controllerId)) {
    return controllerPlayerNames.get(controllerId)!;
  }

  let name = localStorage.getItem(`fiveteenPlayerName_${controllerId}`);
  if (!name) {
    // Use the last part of controllerId (gamepad index) for a more user-friendly prompt
    const promptIndex = controllerId.includes('-') ? controllerId.split('-').pop() : controllerId;
    name = prompt(`Enter player name for controller ${promptIndex} (max 8 characters):`);
    if (name && name.length > 8) {
      name = name.substring(0, 8);
    }
    if (!name) {
      name = `Player${Math.floor(Math.random() * 1000)}`;
    }
    localStorage.setItem(`fiveteenPlayerName_${controllerId}`, name);
  }
  controllerPlayerNames.set(controllerId, name);
  return name;
}

function connectWebSocket() {
  socket = new WebSocket(`ws://${window.location.hostname}:8080`);
  socket.addEventListener("open", () => {
    reconnectAttempts = 0;
    statusSpan.textContent = "Connected";
    // send init for any controllers already detected
    Object.entries(controllerIds).forEach(([_, ctrlId]) => {
      // Correctly get ctrlId
      socket.send(
        JSON.stringify({
          type: "init",
          clientId: ctrlId, // This is the controller's unique ID
          playerName: getPlayerName(ctrlId),
        })
      );
    });
  });
  socket.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "state") {
        renderGameState(msg.state);
      } else if (msg.type === "level") {
        currentLevel = msg.levelId;
        levelSelect.value = currentLevel;
      }
    } catch {}
  });
  socket.addEventListener("close", () => {
    statusSpan.textContent = "Disconnected";
    const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts);
    reconnectAttempts++;
    setTimeout(connectWebSocket, delay); // Corrected: Call connectWebSocket
  });
  socket.addEventListener("error", (err) => {
    statusSpan.textContent = "Error";
  });
}
connectWebSocket(); // Corrected: Call connectWebSocket

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  let r = 0,
    g = 0,
    b = 0;
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, rHex, gHex, bHex) => {
    return "#" + rHex + rHex + gHex + gHex + bHex + bHex;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Fallback if hex is not in a recognized format (e.g., already rgba or a named color)
  // This basic fallback won't correctly parse all color names or existing rgba strings to add/modify alpha.
  // For simplicity, we assume valid hex input as per TEAM_COLORS.
  return `rgba(255, 255, 255, ${alpha})`; // Default to semi-transparent white on error
}

// Level select change
levelSelect.addEventListener("change", () => {
  currentLevel = levelSelect.value;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "level", levelId: currentLevel }));
  }
});

// Visual constants
const PLAYER_RADIUS = 20; // px radius of main circle
const AIM_OFFSET = 38; // px distance from player center to aim circle center
const AIM_RADIUS = 8; // px radius of aim circle
const DEAD_ZONE = 0.1; // joystick dead-zone threshold
const BALLOON_RADIUS = 8; // px radius of balloon
const SCORE_FONT = "16px sans-serif";
// wetness UI: number of hits to full, and radius multiplier for arc
// const WETNESS_THRESHOLD = 3; // Old client-side threshold
const MAX_WETNESS = 100; // New: Matches server-side MAX_WETNESS for UI consistency

const WETNESS_RADIUS = PLAYER_RADIUS * 0.7; // This might be deprecated if fill is full
const LERP_FACTOR = 0.2; // Smoothing factor for player movement
// const TEAM_COLORS = ["#f00", "#00f"]; // Old way - still used for direct hex access for drawing

// Umbrella visual constants
const UMBRELLA_WIDTH_PX = PLAYER_RADIUS * 2.5;
const UMBRELLA_THICKNESS_PX = PLAYER_RADIUS * 0.3;
const UMBRELLA_HANDLE_LENGTH_PX = PLAYER_RADIUS * 0.5; // Length of the handle
const UMBRELLA_HANDLE_THICKNESS_PX = PLAYER_RADIUS * 0.1; // Thickness of the handle
const BASE_UMBRELLA_OFFSET_Y_PX = PLAYER_RADIUS + 5; // Base offset (canvas coordinates)
const UMBRELLA_MAX_REACH_MULTIPLIER_CLIENT = 3.0; // Matches server for consistency

const PLAYER_NAME_FONT = "12px sans-serif"; // Font for player names
const PLAYER_NAME_OFFSET_Y = 5; // Offset below player circle for name

// New: Define TeamInfo structure matching server, though client might only use parts of it
interface TeamInfoClient {
  hex: string;
  name: string;
  cssColor: string;
}

// This will be populated by the server's `teamNames` and `TEAM_COLORS` (hex) if needed directly.
// For now, direct hex values are still used for canvas drawing from TEAM_COLORS.
// The team names will be used for UI text.
let TEAM_DISPLAY_NAMES: string[] = ["Team 1", "Team 2"]; // Default/placeholder
const TEAM_HEX_COLORS = ["#f00", "#00f"]; // Kept for direct canvas color access

// Player object from server includes x/y
interface PlayerState {
  id: string;
  playerName: string; // Added: Player's chosen name
  ratioX: number; // in [-1,1]
  ratioY: number;
  aimX: number; // normalized aim vector X
  aimY: number; // normalized aim vector Y
  score: number;
  team: number; // team index
  wetnessLevel: number;
  wetnessColor: string;
  isUmbrellaOpen: boolean; // Added for umbrella state
  umbrellaAngle: number; // Added for umbrella angle
}

interface BalloonState {
  id: string;
  x: number;
  y: number;
  team: number;
  teamColor: string;
  wetnessLevel: number;
  power?: number; // Optional: throw power for visual effects
}

// Added: Interface for PlayerPersistentStats for client-side use
interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}

// Added: Interface for GameState to include teamScores
interface GameState {
  players: PlayerState[];
  balloons: BalloonState[];
  teamScores: number[];
  friendlyFireEnabled: boolean; // Added: friendlyFireEnabled to GameState
  gameOver: boolean; // Added: gameOver state
  winningTeam: number | null; // Added: winningTeam
  persistentPlayerStats: PlayerPersistentStats[]; // Added: Persistent player stats
  teamSessionWins: number[]; // Added: Persistent team session wins
  teamNames: string[]; // Added: Team display names from server
}

// Client-side state for smooth rendering
const renderedPlayerPositions = new Map<string, { x: number; y: number }>();

// Render players using server‐driven positions
function renderGameState(state: GameState) {
  // Changed: Parameter to GameState
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const {
    players,
    balloons,
    teamScores,
    friendlyFireEnabled,
    gameOver,
    winningTeam,
    persistentPlayerStats, // Destructure new stats
    teamSessionWins, // Destructure new stats
    teamNames, // Destructure new team names
  } = state; // Destructure state

  // Update team display names if provided
  if (teamNames && teamNames.length > 0) {
    TEAM_DISPLAY_NAMES = teamNames;
  }

  // Update team scores display
  const team0ScoreSpan = document.getElementById("team0score");
  const team1ScoreSpan = document.getElementById("team1score");
  const team0NameSpan = document.getElementById("team0name");
  const team1NameSpan = document.getElementById("team1name");

  if (
    team0ScoreSpan &&
    team1ScoreSpan &&
    teamScores &&
    team0NameSpan &&
    team1NameSpan
  ) {
    team0NameSpan.textContent = TEAM_DISPLAY_NAMES[0];
    team0NameSpan.style.color = TEAM_HEX_COLORS[0];
    team0ScoreSpan.textContent = teamScores[0].toString();
    // team0ScoreSpan.style.color = TEAM_HEX_COLORS[0]; // Color applied to name span now

    team1NameSpan.textContent = TEAM_DISPLAY_NAMES[1];
    team1NameSpan.style.color = TEAM_HEX_COLORS[1];
    team1ScoreSpan.textContent = teamScores[1].toString();
    // team1ScoreSpan.style.color = TEAM_HEX_COLORS[1]; // Color applied to name span now
  }

  // Update Session Wins display
  const team0SessionWinsSpan = document.getElementById("team0sessionwins");
  const team1SessionWinsSpan = document.getElementById("team1sessionwins");
  const team0SessionNameSpan = document.getElementById("team0sessionname");
  const team1SessionNameSpan = document.getElementById("team1sessionname");

  if (
    team0SessionWinsSpan &&
    team1SessionWinsSpan &&
    teamSessionWins &&
    team0SessionNameSpan &&
    team1SessionNameSpan
  ) {
    team0SessionNameSpan.textContent = TEAM_DISPLAY_NAMES[0];
    team0SessionNameSpan.style.color = TEAM_HEX_COLORS[0];
    team0SessionWinsSpan.textContent = teamSessionWins[0].toString();

    team1SessionNameSpan.textContent = TEAM_DISPLAY_NAMES[1];
    team1SessionNameSpan.style.color = TEAM_HEX_COLORS[1];
    team1SessionWinsSpan.textContent = teamSessionWins[1].toString();
  }

  // Update Friendly Fire status display
  const ffStatusSpan = document.getElementById("ffStatus");
  if (ffStatusSpan) {
    ffStatusSpan.textContent = friendlyFireEnabled ? "ON" : "OFF";
    ffStatusSpan.style.color = friendlyFireEnabled ? "green" : "red";
  }

  // Display Game Over message if applicable
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    const winnerText =
      winningTeam !== null
        ? `${TEAM_DISPLAY_NAMES[winningTeam]} Wins!`
        : "Game Over!";
    ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 60); // Adjusted position

    // Display Persistent Stats Leaderboard
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#ccc";
    ctx.fillText("Session Stats:", canvas.width / 2, canvas.height / 2 - 20);
    if (persistentPlayerStats && persistentPlayerStats.length > 0) {
      persistentPlayerStats.sort((a, b) => b.conversions - a.conversions); // Sort by conversions
      let statYPos = canvas.height / 2 + 10;
      ctx.textAlign = "left";
      const col1X = canvas.width / 2 - 150;
      const col2X = canvas.width / 2 + 0;
      const col3X = canvas.width / 2 + 70;
      const col4X = canvas.width / 2 + 140;

      ctx.fillStyle = "#fff";
      ctx.fillText("Player", col1X, statYPos);
      ctx.fillText("Conv", col2X, statYPos);
      ctx.fillText("Deaths", col3X, statYPos);
      ctx.fillText("Wins", col4X, statYPos);
      statYPos += 25;

      persistentPlayerStats.forEach((stats, index) => {
        if (index < 5) {
          // Display top 5 players or so
          ctx.fillStyle =
            TEAM_HEX_COLORS[
              players.find((p) => p.playerName === stats.playerName)?.team ?? 0
            ] || "#fff";
          ctx.fillText(stats.playerName.substring(0, 8), col1X, statYPos);
          ctx.fillStyle = "#fff";
          ctx.fillText(stats.conversions.toString(), col2X, statYPos);
          ctx.fillText(stats.deathsByConversion.toString(), col3X, statYPos);
          ctx.fillText(stats.gamesWon.toString(), col4X, statYPos);
          statYPos += 20;
        }
      });
    } else {
      ctx.textAlign = "center";
      ctx.fillText(
        "No persistent stats yet.",
        canvas.width / 2,
        canvas.height / 2 + 10
      );
    }

    ctx.textAlign = "center"; // Reset alignment for button text
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(
      "Click Restart or wait for new players",
      canvas.width / 2,
      canvas.height / 2 + 130 // Adjusted position
    );

    // Remove previous restart button if it exists
    const existingButton = document.getElementById("restartButton");
    if (existingButton) {
      existingButton.remove();
    }

    // Create Restart Button
    const restartButton = document.createElement("button");
    restartButton.id = "restartButton";
    restartButton.textContent = "Restart Game";
    restartButton.style.position = "absolute";
    restartButton.style.left = "50%";
    restartButton.style.top = "calc(50% + 170px)"; // Adjusted position to be below stats
    restartButton.style.transform = "translate(-50%, -50%)";
    restartButton.style.padding = "10px 20px";
    restartButton.style.fontSize = "20px";
    restartButton.style.cursor = "pointer";
    restartButton.onclick = () => {
      console.log(
        "Restart button clicked! WebSocket state:",
        socket.readyState
      );
      if (socket.readyState === WebSocket.OPEN) {
        console.log("Sending restart_game message...");
        socket.send(JSON.stringify({ type: "restart_game" }));
        // Remove the button only after successfully sending the message
        restartButton.remove();
        console.log("Restart message sent and button removed");
      } else {
        // Optional: alert the user or simply leave the button so they can try again
        // For now, we'll just not remove it, allowing another attempt when connected.
        console.warn(
          "Could not send restart_game: WebSocket not open. State:",
          socket.readyState
        );
        alert("Connection issue: Please wait and try again.");
      }
    };
    document.body.appendChild(restartButton);

    // No further rendering if game is over (button is outside canvas)
    return;
  } else {
    // Ensure restart button is removed if game is not over
    const existingButton = document.getElementById("restartButton");
    if (existingButton) {
      existingButton.remove();
    }
  }

  // draw balloons
  // draw balloons by team color
  balloons.forEach((b) => {
    ctx.fillStyle = b.teamColor;
    const bx = canvas.width / 2 + b.x * (canvas.width / 2);
    const by = canvas.height / 2 + b.y * (canvas.height / 2);
    // Optional: scale balloon size by power
    const radius = b.power
      ? BALLOON_RADIUS * (1 + b.power / 2)
      : BALLOON_RADIUS;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
  // draw players
  players.forEach((p) => {
    // Target position from server
    const targetX = canvas.width / 2 + p.ratioX * (canvas.width / 2);
    const targetY = canvas.height / 2 + p.ratioY * (canvas.height / 2);

    // Get or initialize current rendered position
    let currentPos = renderedPlayerPositions.get(p.id);
    if (!currentPos) {
      currentPos = { x: targetX, y: targetY };
      renderedPlayerPositions.set(p.id, currentPos);
    }

    // Lerp towards the target position for x, but set y directly
    currentPos.x += (targetX - currentPos.x) * LERP_FACTOR;
    currentPos.y = targetY; // No lerping for vertical movement

    const cx = currentPos.x;
    const cy = currentPos.y;

    // player main circle (background)
    ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000"; // Player's team hex color for the main body
    ctx.beginPath();
    ctx.arc(cx, cy, PLAYER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    // Wetness effect: clipped circle in front, filling from the bottom up
    if (p.wetnessLevel > 0) {
      const progress = Math.min(p.wetnessLevel / MAX_WETNESS, 1);

      ctx.save(); // Save current drawing state

      // Define the clipping rectangle for the wetness effect.
      // The rectangle starts from the bottom of the player circle and its height increases with wetness,
      // effectively revealing the wetness circle from the bottom up.
      const clipHeight = progress * 2 * PLAYER_RADIUS;
      const clipX = cx - PLAYER_RADIUS;
      const clipY = cy + PLAYER_RADIUS - clipHeight;

      ctx.beginPath();
      ctx.rect(clipX, clipY, 2 * PLAYER_RADIUS, clipHeight);
      ctx.clip(); // Apply clipping

      // Determine the color for the wetness effect
      // Use the opposing team's color for better visibility
      const opposingTeamIndex = (p.team + 1) % TEAM_HEX_COLORS.length; // Assumes 2 teams for simplicity of "next"
      const wetnessEffectColorHex =
        TEAM_HEX_COLORS[opposingTeamIndex] || "#888888"; // Fallback to grey

      // Draw the wetness overlay circle (this will be clipped)
      ctx.fillStyle = hexToRgba(wetnessEffectColorHex, 0.75); // Use opposing team's color with 75% alpha
      ctx.beginPath();
      ctx.arc(cx, cy, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore(); // Restore drawing state (remove clipping)
    }

    // Draw aim circle only if aim is beyond dead zone AND umbrella is NOT open
    const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY);
    if (aimMagnitude > DEAD_ZONE && !p.isUmbrellaOpen) {
      const aimDrawX = cx + p.aimX * AIM_OFFSET;
      const aimDrawY = cy + p.aimY * AIM_OFFSET;
      ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000"; // Player's team color, opaque
      ctx.beginPath();
      ctx.arc(aimDrawX, aimDrawY, AIM_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw umbrella if open
    if (p.isUmbrellaOpen) {
      ctx.save();

      const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY);
      let currentReachMultiplier = 1.0;
      if (aimMagnitude > DEAD_ZONE) {
        const normalizedAimMagnitude = Math.min(aimMagnitude, 1.0); // Ensure 0-1 for multiplier calculation
        currentReachMultiplier =
          1 +
          (UMBRELLA_MAX_REACH_MULTIPLIER_CLIENT - 1) * normalizedAimMagnitude;
      }

      const dynamicUmbrellaOffsetY =
        BASE_UMBRELLA_OFFSET_Y_PX * currentReachMultiplier;

      // The umbrella's visual pivot point is still the player's center (cx, cy).
      // The canopy and handle are drawn relative to this, but offset further by dynamicUmbrellaOffsetY along p.umbrellaAngle.

      ctx.translate(cx, cy); // Translate to player's center for rotation
      ctx.rotate(p.umbrellaAngle + Math.PI / 2); // Rotate to aim direction (adjusting for canvas coord system)

      const teamColor = TEAM_HEX_COLORS[p.team] || "#grey";
      ctx.fillStyle = teamColor;

      // Draw the umbrella canopy
      // It's positioned dynamicUmbrellaOffsetY units away from the player center along the current rotation.
      // In the rotated context, this means along the negative Y-axis.
      ctx.beginPath();
      ctx.fillRect(
        -UMBRELLA_WIDTH_PX / 2, // Centered horizontally relative to the rotated axis
        -dynamicUmbrellaOffsetY - UMBRELLA_THICKNESS_PX, // Positioned outward along the rotated axis
        UMBRELLA_WIDTH_PX,
        UMBRELLA_THICKNESS_PX
      );

      // Draw the umbrella handle
      // The handle extends from the player's center (now the origin of the rotated context)
      // towards the canopy, along the new negative Y-axis.
      ctx.strokeStyle = teamColor; // Use team color for the handle stroke
      ctx.lineWidth = UMBRELLA_HANDLE_THICKNESS_PX;
      ctx.beginPath();
      ctx.moveTo(0, 0); // Start at the player's center (current origin)
      // End point is along the rotated Y-axis, just before the canopy starts
      ctx.lineTo(0, -dynamicUmbrellaOffsetY + UMBRELLA_HANDLE_THICKNESS_PX / 2); // Connects to the base of the canopy
      ctx.stroke();

      ctx.restore();
    }

    // Draw player name
    ctx.fillStyle = TEAM_HEX_COLORS[p.team] || "#000"; // Use player's team color for name
    ctx.font = PLAYER_NAME_FONT; // Use defined constant
    ctx.textAlign = "center";
    ctx.fillText(
      p.playerName.substring(0, 8),
      cx,
      cy + PLAYER_RADIUS + PLAYER_NAME_OFFSET_Y
    ); // Use defined constant
  });
}

// Track window focus
let windowActive = document.hasFocus();
window.addEventListener("focus", () => (windowActive = true));
window.addEventListener("blur", () => (windowActive = false));

// Map gamepad index to unique controller clientId
const controllerIds: Record<number, string> = {};
// Poll gamepad input from all connected controllers
function pollGamepad() {
  if (!windowActive) {
    return requestAnimationFrame(pollGamepad);
  }
  const gps = navigator.getGamepads();
  gps.forEach((gp, idx) => {
    if (!gp) return;
    // initialize controller if first seen
    if (!(idx in controllerIds)) {
      // Generate a unique ID for this controller for this browser client session
      const ctrlId = `${clientId}-${idx}`; // clientId is the browser tab's unique ID
      controllerIds[idx] = ctrlId;
      const playerNameForInit = getPlayerName(ctrlId);
      // send init immediately if socket is open
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "init",
            clientId: ctrlId, // This is the controller's unique ID
            playerName: playerNameForInit,
          })
        );
      }
    }
    const ctrlId = controllerIds[idx];
    // apply dead-zone: ignore small stick movement
    const axes = gp.axes.map((a) => (Math.abs(a) > DEAD_ZONE ? a : 0));
    const buttons = gp.buttons.map((b) => b.pressed);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "input", clientId: ctrlId, axes, buttons })
      );
    }
  });
  requestAnimationFrame(pollGamepad);
}

// Begin polling immediately (captures already-connected gamepads)
pollGamepad();

// handle controller disconnect to remove player
window.addEventListener("gamepaddisconnected", (e) => {
  const idx = e.gamepad.index;
  const ctrlId = controllerIds[idx];
  if (ctrlId && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "disconnect", clientId: ctrlId }));
  }
  delete controllerIds[idx];
});
// handle controller reconnect to show player again
window.addEventListener("gamepadconnected", (e) => {
  const idx = e.gamepad.index;
  // Generate a unique ID for this controller for this browser client session
  const ctrlId = `${clientId}-${idx}`; // clientId is the browser tab's unique ID
  controllerIds[idx] = ctrlId;
  const playerNameForInit = getPlayerName(ctrlId);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "init",
        clientId: ctrlId, // This is the controller's unique ID
        playerName: playerNameForInit,
      })
    );
  }
});
