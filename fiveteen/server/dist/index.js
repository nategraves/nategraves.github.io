"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const http_1 = __importDefault(require("http"));
const ws_1 = __importStar(require("ws"));
// Level bounds constants
const LEVEL_WIDTH = 1000;
const LEVEL_HEIGHT = 600;
const HALF_W = LEVEL_WIDTH / 2;
const HALF_H = LEVEL_HEIGHT / 2;
// Player drawing constants (server uses normalized ratios)
const PLAYER_RADIUS_PX = 20; // Renamed to avoid conflict if PLAYER_RADIUS is used elsewhere for ratio
const AIM_OFFSET_PX_CONST = 38; // Renamed to avoid conflict
const MAX_JUMPS_CONST = 2; // Renamed to avoid conflict
// Level bounds half-dimensions
const MAX_RATIO_X = 1 - PLAYER_RADIUS_PX / HALF_W;
const MAX_RATIO_Y = 1 - PLAYER_RADIUS_PX / HALF_H;
// Physics constants
const GRAVITY = 10; // ratio units per second² downward
const JUMP_VELOCITY = -1.5; // ratio units per second upward
const THROW_SPEED = 2; // ratio units per second for balloon velocity
const DEAD_ZONE = 0.1; // minimal aim threshold
const MAX_CHARGE_TIME = 1000; // ms to reach full throw power
const MAX_WETNESS = 100;
const WETNESS_PER_HIT = 10;
const PLAYER_DRYING_RATE_CONST = 5; // Renamed
const TERMINAL_VELOCITY_CONST = 2.5; // Base terminal velocity
// Umbrella constants
const UMBRELLA_GRAVITY_MULTIPLIER = 0.5;
const UMBRELLA_DEFAULT_ANGLE = -Math.PI / 2; // Pointing upwards
const UMBRELLA_WIDTH_RATIO = (PLAYER_RADIUS_PX * 2.5) / HALF_W; // Umbrella is wider than player
const UMBRELLA_HEIGHT_RATIO = (PLAYER_RADIUS_PX * 0.5) / HALF_H; // For collision, a flat-ish rectangle
const UMBRELLA_OFFSET_Y_RATIO = (PLAYER_RADIUS_PX + 5) / HALF_H; // Offset above the player's center
const UMBRELLA_TERMINAL_VELOCITY = TERMINAL_VELOCITY_CONST * 0.7; // Slower terminal velocity with umbrella
const TEAM_INFO = [
    { hex: '#f00', name: 'Raging Reds', cssColor: 'red' },
    { hex: '#00f', name: 'Brave Blues', cssColor: 'blue' },
];
// const TEAM_COLORS = ['#f00', '#00f']; // Old way
const TEAM_COLORS = TEAM_INFO.map((t) => t.hex); // Keep for direct hex access if needed, or phase out
// const WETNESS_THRESHOLD = 3; // Old: hits to switch team on wetness threshold
// const PLAYER_DRYING_RATE = 5; // Defined as PLAYER_DRYING_RATE_CONST
// const AIM_OFFSET_PX = 38; // Defined as AIM_OFFSET_PX_CONST
// const MAX_JUMPS = 2; // Defined as MAX_JUMPS_CONST
let nextTeam = 0;
let friendlyFireEnabled = false; // Added: Friendly fire toggle
const teamScores = [0, 0]; // Added: Team scores for the current game
let gameOver = false; // New: Game over state
let winningTeam = null; // New: Winning team
const playerPersistentStats = new Map();
const teamSessionWins = [0, 0]; // Tracks total games won by each team in the session
// Tunable move and jump settings
const MOVE_SPEED = 200; // horizontal speed in ratio units per second (increase for faster movement)
const JUMP_MULTIPLIER = 3; // multiplier for jump velocity
// Collision detection radius in ratio units (approximate)
const COLLISION_RADIUS = PLAYER_RADIUS_PX / HALF_W;
// initial balloon radius matches collision radius
const BALLOON_RADIUS_RATIO = COLLISION_RADIUS;
function createServer(port) {
    const server = http_1.default.createServer();
    const wss = new ws_1.WebSocketServer({ server });
    const players = new Map();
    const balloons = [];
    let lastTick = null; // Declare lastTick here
    const socketClientId = new Map(); // Maps WebSocket connection to the first clientId associated with it
    const clientAssociatedControllerIds = new Map(); // Maps WebSocket to a set of controller clientIds
    const disconnectedPlayerStates = new Map(); // Stores state of disconnected players
    wss.on('connection', (ws) => {
        clientAssociatedControllerIds.set(ws, new Set());
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                const currentControllerClientIds = clientAssociatedControllerIds.get(ws);
                switch (msg.type) {
                    case 'init':
                        const controllerId = msg.clientId;
                        currentControllerClientIds.add(controllerId);
                        // If this is the first init message from this WebSocket, store its primary clientId
                        if (!socketClientId.has(ws)) {
                            socketClientId.set(ws, controllerId);
                        }
                        const playerName = msg.playerName || `Player_${controllerId.substring(0, 4)}`;
                        if (disconnectedPlayerStates.has(controllerId)) {
                            // Player is reconnecting
                            const prevState = disconnectedPlayerStates.get(controllerId);
                            players.set(controllerId, {
                                // Restore previous state
                                id: controllerId,
                                playerName: playerName, // Update name if changed, or use old one
                                ratioX: prevState.ratioX !== undefined ? prevState.ratioX : 0,
                                ratioY: prevState.ratioY !== undefined ? prevState.ratioY : 0,
                                vx: prevState.vx !== undefined ? prevState.vx : 0,
                                vy: prevState.vy !== undefined ? prevState.vy : 0,
                                aimX: prevState.aimX !== undefined ? prevState.aimX : 0,
                                aimY: prevState.aimY !== undefined ? prevState.aimY : 0,
                                score: prevState.score !== undefined ? prevState.score : 0,
                                team: prevState.team !== undefined
                                    ? prevState.team
                                    : nextTeam % TEAM_INFO.length,
                                wetnessLevel: prevState.wetnessLevel !== undefined
                                    ? prevState.wetnessLevel
                                    : 0,
                                wetnessColor: prevState.wetnessColor ||
                                    TEAM_INFO[prevState.team !== undefined
                                        ? prevState.team
                                        : nextTeam % TEAM_INFO.length].hex,
                                isGrounded: prevState.isGrounded !== undefined
                                    ? prevState.isGrounded
                                    : true,
                                prevJump: false,
                                jumpsRemaining: prevState.jumpsRemaining !== undefined
                                    ? prevState.jumpsRemaining
                                    : MAX_JUMPS_CONST,
                                prevTrigger: false,
                                triggerStart: null,
                                buttons: Array(16).fill(false),
                                isUmbrellaOpen: prevState.isUmbrellaOpen !== undefined
                                    ? prevState.isUmbrellaOpen
                                    : false,
                                umbrellaAngle: prevState.umbrellaAngle !== undefined
                                    ? prevState.umbrellaAngle
                                    : UMBRELLA_DEFAULT_ANGLE,
                                // prevLeftTrigger: false, // Removed
                            });
                            disconnectedPlayerStates.delete(controllerId);
                            console.log(`Player ${playerName} (ID: ${controllerId}) reconnected.`);
                        }
                        else if (!players.has(controllerId)) {
                            // New player
                            if (!playerPersistentStats.has(playerName)) {
                                playerPersistentStats.set(playerName, {
                                    playerName: playerName,
                                    conversions: 0,
                                    deathsByConversion: 0,
                                    gamesWon: 0,
                                });
                            }
                            const teamIdx = nextTeam;
                            nextTeam = (nextTeam + 1) % TEAM_INFO.length;
                            players.set(controllerId, {
                                id: controllerId,
                                playerName: playerName,
                                ratioX: 0,
                                ratioY: 0,
                                vx: 0,
                                vy: 0,
                                aimX: 0,
                                aimY: 0,
                                score: 0,
                                team: teamIdx,
                                wetnessLevel: 0,
                                wetnessColor: TEAM_INFO[teamIdx].hex,
                                isGrounded: true,
                                prevJump: false,
                                jumpsRemaining: MAX_JUMPS_CONST,
                                prevTrigger: false,
                                triggerStart: null,
                                buttons: Array(16).fill(false),
                                isUmbrellaOpen: false,
                                umbrellaAngle: UMBRELLA_DEFAULT_ANGLE,
                                // prevLeftTrigger: false, // Removed
                            });
                            console.log(`Player ${playerName} (ID: ${controllerId}) connected.`);
                        }
                        // Reset game over state if a new/reconnecting player joins an empty/gameOver game
                        if (players.size === 1 && gameOver) {
                            gameOver = false;
                            winningTeam = null;
                            teamScores[0] = 0;
                            teamScores[1] = 0;
                        }
                        break;
                    case 'restart_game': // Handler for the new restart_game message
                        gameOver = false;
                        winningTeam = null;
                        teamScores[0] = 0;
                        teamScores[1] = 0;
                        // teamSessionWins are not reset
                        // playerPersistentStats are not reset
                        nextTeam = 0; // Reset for fresh team assignments
                        balloons.length = 0; // Clear existing balloons
                        // Reset all players for the new game
                        const currentPlayers = Array.from(players.values());
                        players.clear(); // Clear and re-add to ensure fresh team assignment if needed
                        currentPlayers.forEach((p_orig) => {
                            const teamIdx = nextTeam;
                            nextTeam = (nextTeam + 1) % TEAM_INFO.length;
                            players.set(p_orig.id, {
                                ...p_orig,
                                ratioX: 0,
                                ratioY: 0,
                                vx: 0,
                                vy: 0,
                                team: teamIdx,
                                wetnessLevel: 0,
                                wetnessColor: TEAM_INFO[teamIdx].hex,
                                isGrounded: true,
                                prevJump: false,
                                jumpsRemaining: MAX_JUMPS_CONST,
                                prevTrigger: false,
                                triggerStart: null,
                                buttons: Array(16).fill(false),
                                isUmbrellaOpen: false,
                                umbrellaAngle: UMBRELLA_DEFAULT_ANGLE, // Corrected: Use defined constant
                                // prevLeftTrigger: false, // Removed
                            });
                        });
                        break;
                    case 'input':
                        if (players.has(msg.clientId)) {
                            const p = players.get(msg.clientId);
                            p.buttons = msg.buttons;
                            // set horizontal velocity based on left joystick X
                            const horizSpeed = MOVE_SPEED / HALF_W; // ratio units per second
                            p.vx = msg.axes[0] * horizSpeed;
                            // aim vector
                            p.aimX = msg.axes[2] ?? 0;
                            p.aimY = msg.axes[3] ?? 0;
                            // Umbrella logic: Activates when left trigger (buttons[6]) is pressed
                            const leftTriggerPressed = p.buttons[6]; // Assuming buttons[6] is true if trigger is sufficiently pressed
                            p.isUmbrellaOpen = leftTriggerPressed;
                            if (p.isUmbrellaOpen) {
                                // If umbrella is open, its angle is determined by aim input
                                // If aim input is neutral (within dead zone), umbrella points straight up
                                if (Math.abs(p.aimX) < DEAD_ZONE &&
                                    Math.abs(p.aimY) < DEAD_ZONE) {
                                    p.umbrellaAngle = UMBRELLA_DEFAULT_ANGLE; // Default upwards
                                }
                                else {
                                    p.umbrellaAngle = Math.atan2(p.aimY, p.aimX);
                                }
                            }
                            else {
                                // Optional: Reset angle when umbrella is not open, or let it keep its last angle
                                // p.umbrellaAngle = UMBRELLA_DEFAULT_ANGLE; // Reset to default if not open
                            }
                            // p.prevLeftTrigger = leftTriggerPressed; // This is no longer needed for toggle behavior
                            // jump on button[1] (standard seems to be buttons[0] for A/X, but current code uses 1)
                            if (msg.buttons[1] && !p.prevJump && p.jumpsRemaining > 0) {
                                p.vy = JUMP_VELOCITY * JUMP_MULTIPLIER;
                                p.isGrounded = false;
                                p.jumpsRemaining--;
                            }
                            p.prevJump = msg.buttons[1];
                            // Throw balloon logic (right trigger - buttons[7])
                            // Only allow throwing if the umbrella is NOT open
                            const rightTriggerPressed = p.buttons[7];
                            if (rightTriggerPressed && !p.prevTrigger && !p.isUmbrellaOpen) {
                                p.triggerStart = Date.now();
                            }
                            // throw balloon on trigger release, only if umbrella is NOT open
                            if (!rightTriggerPressed &&
                                p.prevTrigger &&
                                p.triggerStart &&
                                !p.isUmbrellaOpen) {
                                // compute charge power
                                const now = Date.now();
                                const start = p.triggerStart ?? now;
                                const hold = Math.min(now - start, MAX_CHARGE_TIME);
                                const throwPower = hold / MAX_CHARGE_TIME; // This is [0, 1]
                                // reset charge timer
                                p.triggerStart = null;
                                const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY);
                                // only throw if aiming
                                if (aimMagnitude > DEAD_ZONE) {
                                    // Normalize aim vector for consistent spawn offset distance
                                    const normAimX = p.aimX / aimMagnitude;
                                    const normAimY = p.aimY / aimMagnitude;
                                    // Calculate spawn offset using normalized aim and fixed distance
                                    const spawnOffsetX = normAimX * (AIM_OFFSET_PX_CONST / HALF_W);
                                    const spawnOffsetY = normAimY * (AIM_OFFSET_PX_CONST / HALF_H);
                                    const spawnX = p.ratioX + spawnOffsetX;
                                    const spawnY = p.ratioY + spawnOffsetY;
                                    // Adjust speed: min is 0.5 * THROW_SPEED, max is 1.0 * THROW_SPEED
                                    // throwPower (charge time) determines the base speed multiplier.
                                    const effectivePower = 0.5 + throwPower * 0.5;
                                    const baseSpeed = THROW_SPEED * effectivePower;
                                    // Balloon velocity uses the original p.aimX, p.aimY, scaled by baseSpeed.
                                    // This means pushing the stick further still results in a faster balloon,
                                    // independent of the now-constant spawn offset distance.
                                    balloons.push({
                                        id: `${msg.clientId}-${now}`,
                                        x: spawnX,
                                        y: spawnY,
                                        vx: p.aimX * baseSpeed, // Original aim vector component for direction and velocity scaling
                                        vy: p.aimY * baseSpeed, // Original aim vector component for direction and velocity scaling
                                        radius: BALLOON_RADIUS_RATIO,
                                        ownerId: msg.clientId,
                                        team: p.team,
                                        teamColor: p.wetnessColor,
                                        power: throwPower, // Store the charge power for potential future use (e.g., visual effects)
                                    });
                                }
                            }
                            // Update prevTrigger for right trigger, regardless of umbrella state for other potential uses.
                            p.prevTrigger = rightTriggerPressed;
                        }
                        break;
                    case 'disconnect':
                        // A specific controller disconnected as per client message
                        const disconnectedControllerId = msg.clientId;
                        const playerToRemove = players.get(disconnectedControllerId);
                        if (playerToRemove) {
                            // Store state for potential reconnection
                            disconnectedPlayerStates.set(disconnectedControllerId, {
                                ...playerToRemove,
                            });
                            players.delete(disconnectedControllerId);
                            console.log(`Player ${playerToRemove.playerName} (ID: ${disconnectedControllerId}) disconnected, state saved.`);
                        }
                        currentControllerClientIds.delete(disconnectedControllerId);
                        // If this was the last controller for this websocket, handle full client disconnect below in ws.on('close')
                        break;
                    case 'ping':
                        // ignore
                        break;
                    case 'level':
                        // broadcast level change to all clients
                        wss.clients.forEach((client) => {
                            if (client.readyState === ws_1.default.OPEN) {
                                client.send(JSON.stringify({ type: 'level', levelId: msg.levelId }));
                            }
                        });
                        break;
                }
            }
            catch (err) {
                console.warn('Malformed message', err);
                // echo back non-JSON messages
                ws.send(`Server echo: ${data.toString()}`);
                return;
            }
        });
        ws.on('close', () => {
            const associatedIds = clientAssociatedControllerIds.get(ws);
            if (associatedIds) {
                associatedIds.forEach((controllerId) => {
                    const playerWhoLeft = players.get(controllerId);
                    if (playerWhoLeft) {
                        // Store state for potential reconnection
                        disconnectedPlayerStates.set(controllerId, { ...playerWhoLeft });
                        players.delete(controllerId);
                        console.log(`Player ${playerWhoLeft.playerName} (ID: ${controllerId}) disconnected due to WebSocket close, state saved.`);
                    }
                });
            }
            socketClientId.delete(ws); // Remove the main WebSocket to clientId mapping
            clientAssociatedControllerIds.delete(ws); // Remove the WebSocket to controller set mapping
            // If all players disconnect, reset game state for next session
            if (players.size === 0) {
                teamScores[0] = 0;
                teamScores[1] = 0;
                gameOver = false;
                winningTeam = null;
                nextTeam = 0;
                // Do not clear disconnectedPlayerStates here, allow them to rejoin next session
            }
        });
    });
    // Game loop: physics + broadcast
    const loop = setInterval(() => {
        const now = Date.now();
        const dt = (now - (lastTick || now)) / 1000; // delta time in seconds
        lastTick = now;
        // Remove out-of-bounds balloons
        for (let i = balloons.length - 1; i >= 0; i--) {
            const b = balloons[i];
            // Apply gravity to balloons
            b.vy += GRAVITY * dt; // Balloons are affected by gravity
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -1 || b.x > 1 || b.y < -1 || b.y > 1)
                balloons.splice(i, 1);
        }
        // Balloon-balloon collision (simple merge for now)
        const toMerge = [];
        const toRemoveIndices = [];
        for (let i = 0; i < balloons.length; i++) {
            if (toRemoveIndices.includes(i))
                continue;
            for (let j = i + 1; j < balloons.length; j++) {
                if (toRemoveIndices.includes(j))
                    continue;
                const b1 = balloons[i];
                const b2 = balloons[j];
                const dx = b1.x - b2.x;
                const dy = b1.y - b2.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < (b1.radius + b2.radius) ** 2) {
                    // Simple merge: create a new, larger balloon, mark old ones for removal
                    // This is a placeholder for more complex merge/pop logic
                    /* const mergedBalloon: GameObject = {
                      id: `merged-${Date.now()}`,
                      x: (b1.x + b2.x) / 2,
                      y: (b1.y + b2.y) / 2,
                      vx: (b1.vx + b2.vx) / 2, // Average velocity
                      vy: (b1.vy + b2.vy) / 2,
                      radius: Math.sqrt(b1.radius ** 2 + b2.radius ** 2), // Combine areas
                      ownerId: b1.ownerId, // Arbitrarily pick b1's owner/team
                      team: b1.team,
                      teamColor: b1.teamColor,
                      power: (b1.power + b2.power) / 2,
                    };
                    toMerge.push(mergedBalloon); // Merging logic can be complex, for now, let's just pop one */
                    toRemoveIndices.push(i); // Mark b1 for removal
                    toRemoveIndices.push(j); // Mark b2 for removal
                    break; // b1 is merged, move to next balloon
                }
            }
        }
        // Remove balloons marked for removal, from highest index to lowest to avoid shifting
        toRemoveIndices
            .sort((a, b) => b - a)
            .forEach((idx) => balloons.splice(idx, 1));
        balloons.push(...toMerge);
        // Player-balloon collision
        for (let i = balloons.length - 1; i >= 0; i--) {
            const b = balloons[i];
            for (const p of players.values()) {
                // Skip collision if player is on the same team and friendly fire is off
                if (p.team === b.team && !friendlyFireEnabled)
                    continue;
                const dx = p.ratioX - b.x;
                const dy = p.ratioY - b.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < (COLLISION_RADIUS + b.radius) ** 2) {
                    // Player hit
                    p.wetnessLevel += WETNESS_PER_HIT * (b.power + 0.5); // More power = more wetness
                    p.wetnessLevel = Math.min(p.wetnessLevel, MAX_WETNESS);
                    if (p.wetnessLevel >= MAX_WETNESS) {
                        // Player is fully wet, switch team
                        const oldTeam = p.team;
                        p.team = (p.team + 1) % TEAM_INFO.length; // Switch to the next team
                        p.wetnessColor = TEAM_INFO[p.team].hex;
                        p.wetnessLevel = 0; // Reset wetness
                        // Update persistent stats
                        const throwerStats = playerPersistentStats.get(players.get(b.ownerId)?.playerName || 'Unknown');
                        if (throwerStats) {
                            throwerStats.conversions++;
                        }
                        const hitPlayerStats = playerPersistentStats.get(p.playerName);
                        if (hitPlayerStats) {
                            hitPlayerStats.deathsByConversion++;
                        }
                        // Update team scores if the player wasn't already on the thrower's team
                        // (or if friendly fire caused a "conversion" to the same team, which is fine)
                        if (oldTeam !== b.team) {
                            teamScores[b.team]++;
                        }
                        else if (friendlyFireEnabled && oldTeam === b.team) {
                            // If friendly fire converts, the original team loses a point (effectively)
                            // and the "new" team (which is the same) gains one.
                            // This logic might need refinement based on desired FF scoring.
                            // For now, let's assume FF conversion still scores for the thrower's team.
                            teamScores[b.team]++;
                        }
                        // Check for game over condition (e.g., first team to X points)
                        const WINNING_SCORE = 5; // Example winning score
                        if (teamScores[b.team] >= WINNING_SCORE) {
                            gameOver = true;
                            winningTeam = b.team;
                            // Update persistent team session wins
                            teamSessionWins[b.team]++;
                            // Update gamesWon for players on the winning team
                            for (const player of players.values()) {
                                if (player.team === winningTeam) {
                                    const stats = playerPersistentStats.get(player.playerName);
                                    if (stats) {
                                        stats.gamesWon++;
                                    }
                                }
                            }
                        }
                    }
                    balloons.splice(i, 1); // Remove balloon
                    break; // Balloon is gone, move to next balloon
                }
            }
        }
        // Umbrella-balloon collision
        balloons.forEach((balloon, balloonIdx) => {
            for (const p of players.values()) {
                if (p.isUmbrellaOpen) {
                    // Simplified umbrella collision: treat umbrella as a rectangle above the player
                    // Umbrella center position
                    const umbrellaCenterX = p.ratioX; // Aligned with player X
                    const umbrellaCenterY = p.ratioY - UMBRELLA_OFFSET_Y_RATIO; // Offset above player
                    // Rotate balloon's relative position to align with umbrella's orientation
                    // (or rotate umbrella's collision box, simpler to rotate balloon relative pos)
                    const cosA = Math.cos(-p.umbrellaAngle); // Negative angle to bring balloon to umbrella's frame
                    const sinA = Math.sin(-p.umbrellaAngle);
                    const translatedBalloonX = balloon.x - umbrellaCenterX;
                    const translatedBalloonY = balloon.y - umbrellaCenterY;
                    const rotatedBalloonX = translatedBalloonX * cosA - translatedBalloonY * sinA;
                    const rotatedBalloonY = translatedBalloonX * sinA + translatedBalloonY * cosA;
                    // AABB collision check with the (now axis-aligned) umbrella
                    if (Math.abs(rotatedBalloonX) <
                        UMBRELLA_WIDTH_RATIO / 2 + balloon.radius &&
                        Math.abs(rotatedBalloonY) <
                            UMBRELLA_HEIGHT_RATIO / 2 + balloon.radius) {
                        // Collision detected!
                        // For now, just destroy the balloon. No wetness applied to player.
                        balloons.splice(balloonIdx, 1); // Remove balloon
                        // Potentially add sound effect, score for blocking, etc. later
                        // console.log(`Player ${p.id} blocked balloon with umbrella`);
                        break; // Balloon is gone, move to next player check for this balloon (or next balloon if outer loop continues)
                    }
                }
            }
        });
        // Player physics and updates
        for (const p of players.values()) {
            // Apply gravity
            let currentGravity = GRAVITY;
            let currentTerminalVelocity = TERMINAL_VELOCITY_CONST;
            if (p.isUmbrellaOpen && p.vy > 0) {
                // If umbrella is open and player is falling
                currentGravity *= UMBRELLA_GRAVITY_MULTIPLIER;
                currentTerminalVelocity = UMBRELLA_TERMINAL_VELOCITY;
            }
            p.vy += currentGravity * dt;
            p.vy = Math.min(p.vy, currentTerminalVelocity); // Apply terminal velocity
            // update position based on velocity
            p.ratioX += p.vx * dt;
            p.ratioY += p.vy * dt;
            // collision with ground
            if (p.ratioY > MAX_RATIO_Y) {
                p.ratioY = MAX_RATIO_Y;
                p.vy = 0;
                p.isGrounded = true;
                p.jumpsRemaining = MAX_JUMPS_CONST; // Reset jumps on ground
            }
            else {
                // Player is not on the ground, so they are not grounded
                // This is important for preventing mid-air jumps after walking off a ledge
                p.isGrounded = false;
            }
            // collision with ceiling
            if (p.ratioY < -MAX_RATIO_Y) {
                p.ratioY = -MAX_RATIO_Y;
                p.vy = 0;
            }
            // collision with walls
            if (p.ratioX > MAX_RATIO_X) {
                p.ratioX = MAX_RATIO_X;
                p.vx = 0;
            }
            if (p.ratioX < -MAX_RATIO_X) {
                p.ratioX = -MAX_RATIO_X;
                p.vx = 0;
            }
            // Player drying
            if (p.wetnessLevel > 0) {
                p.wetnessLevel -= PLAYER_DRYING_RATE_CONST * dt;
                p.wetnessLevel = Math.max(0, p.wetnessLevel);
            }
            // Umbrella physics interaction (e.g., slow descent)
            // This is now partially handled by adjusting gravity and terminal velocity when umbrella is open.
        }
        // Check for game over if all players are on the same team (alternative to score-based win)
        if (!gameOver && players.size > 1) {
            const firstPlayer = players.values().next().value;
            if (firstPlayer) {
                // Check if firstPlayer is defined
                const firstPlayerTeam = firstPlayer.team;
                let allSameTeam = true;
                for (const p of players.values()) {
                    if (p.team !== firstPlayerTeam) {
                        allSameTeam = false;
                        break;
                    }
                }
                if (allSameTeam) {
                    gameOver = true;
                    winningTeam = firstPlayerTeam; // firstPlayerTeam is a number here
                    teamSessionWins[firstPlayerTeam]++; // firstPlayerTeam is a number here
                    // Update gamesWon for players on the winning team
                    for (const player of players.values()) {
                        if (player.team === winningTeam) {
                            const stats = playerPersistentStats.get(player.playerName);
                            if (stats) {
                                stats.gamesWon++;
                            }
                        }
                    }
                }
            }
        }
        // Prepare persistent stats for sending (convert map to array)
        const persistentPlayerStatsArray = Array.from(playerPersistentStats.values());
        // broadcast game state to all clients
        const numPlayers = players.size;
        if (numPlayers === 0 && balloons.length === 0 && !gameOver)
            return;
        const gameState = {
            players: Array.from(players.values()),
            balloons,
            teamScores,
            friendlyFireEnabled,
            gameOver, // Include game over state
            winningTeam, // Include winning team
            persistentPlayerStats: persistentPlayerStatsArray,
            teamSessionWins,
            teamNames: TEAM_INFO.map((t) => t.name),
        };
        const payload = JSON.stringify({ type: 'state', state: gameState });
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN)
                client.send(payload);
        });
    }, 1000 / 30);
    // allow process exit when no other events
    loop.unref();
    server.listen(port);
    return { server, wss };
}
// If run directly
if (require.main === module) {
    createServer(8080);
}
