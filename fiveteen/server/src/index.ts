import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as types from './types/index';
import {
  initializePlayer,
  randomFloorPosition,
  // updateGamePhysics, // We will manage physics updates differently
} from './functions/index';
import {
  kv, // Import the kv client
  getPlayer,
  setPlayer,
  deletePlayer,
  getPlayerStats,
  setPlayerStats,
  getAllPlayerStats,
  addActivePlayer,
  removeActivePlayer,
  getActivePlayerIds,
  getActivePlayerCount,
  getBalloons, // New KV function for balloons
  setBalloons, // New KV function for balloons
  clearBalloons, // New KV function for balloons
  getGameSettings, // New KV function for game settings
  setGameSettings, // New KV function for game settings
  initializeDefaultGameSettings, // New KV function for game settings
  type GameSettings, // Import GameSettings type
} from './kvStore'; // Import KV store functions

// Level bounds constants
const LEVEL_WIDTH = 1000;
const LEVEL_HEIGHT = 600;
const HALF_W = LEVEL_WIDTH / 2;
const HALF_H = LEVEL_HEIGHT / 2;

// Player drawing constants (server uses normalized ratios)
const PLAYER_RADIUS_PX = 20; // Renamed to avoid conflict if PLAYER_RADIUS is used elsewhere for ratio
const AIM_OFFSET_PX_CONST = 38; // Match client's AIM_OFFSET for aim circle
const MAX_JUMPS_CONST = 2; // Renamed to avoid conflict

// Player radius in ratio coordinates
const PLAYER_RADIUS_RATIO_X = PLAYER_RADIUS_PX / HALF_W;
const PLAYER_RADIUS_RATIO_Y = PLAYER_RADIUS_PX / HALF_H;

// New constant for game logic
const POINTS_TO_WIN = 10; // Example: Points needed to win a game

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
const WETNESS_PER_HIT = 15; // Increased from 10 to 15
const PLAYER_DRYING_RATE_CONST = 5; // Renamed
const TERMINAL_VELOCITY_CONST = 2.5; // Base terminal velocity

// Umbrella constants
const UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER = 0.85; // New: 15% slower
const UMBRELLA_DEFAULT_ANGLE = -Math.PI / 2; // Pointing upwards
const UMBRELLA_WIDTH_RATIO = (PLAYER_RADIUS_PX * 2.5) / HALF_W; // Umbrella is wider than player
const UMBRELLA_HEIGHT_RATIO = (PLAYER_RADIUS_PX * 0.5) / HALF_H; // For collision, a flat-ish rectangle
const UMBRELLA_OFFSET_Y_RATIO = (PLAYER_RADIUS_PX + 5) / HALF_H; // Base offset above the player's center
const UMBRELLA_TERMINAL_VELOCITY = TERMINAL_VELOCITY_CONST * 0.7; // Slower terminal velocity with umbrella
const UMBRELLA_MAX_REACH_MULTIPLIER = 3.0; // New: Max reach multiplier
const BASE_UMBRELLA_DISTANCE_RATIO = UMBRELLA_OFFSET_Y_RATIO; // New: Clarity for base offset
const UMBRELLA_GRAVITY_MULTIPLIER = 0.5; // Restored constant for umbrella gravity multiplier

// Missing physics and collision constants
const PLAYER_HEIGHT_RATIO = 0.1; // Ratio for player height offset
const MOVE_SPEED = 350; // Base move speed in px/s
const JUMP_MULTIPLIER = 3; // Multiplier for jump velocity
const BALLOON_RADIUS_PX = 8; // Balloon radius in pixels
const BALLOON_RADIUS_RATIO = BALLOON_RADIUS_PX / HALF_W; // Convert balloon radius to ratio units
const COLLISION_RADIUS = PLAYER_RADIUS_PX / HALF_W; // Collision radius in ratio units

export interface TeamInfo {
  hex: string;
  name: string;
  cssColor: string;
}

const TEAM_INFO: TeamInfo[] = [
  { hex: '#f00', name: 'Raging Reds', cssColor: 'red' },
  { hex: '#00f', name: 'Brave Blues', cssColor: 'blue' },
];

// REMOVE: In-memory game state variables - these will be managed in KV via GameSettings
// let nextTeam = 0;
// let friendlyFireEnabled = false;
// const teamScores = [0, 0];
// let gameOver = false;
// let winningTeam: number | null = null;

// Persistent Stats
interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}
// const playerPersistentStats = new Map<string, PlayerPersistentStats>(); // REMOVE: Replaced by KV store
// const teamSessionWins = [0, 0]; // REMOVE: This will be part of GameSettings in KV

// Initialize game settings from KV or set defaults
(async () => {
  try {
    let settings = await getGameSettings();
    if (!settings) {
      console.log(
        '[SERVER LOG] No game settings found in KV, initializing defaults.'
      );
      // Pass team names for array sizing if needed by initializeDefaultGameSettings
      settings = await initializeDefaultGameSettings(
        TEAM_INFO.map((t) => t.name)
      );
    }
    // console.log('[SERVER LOG] Game settings loaded/initialized:', settings);
  } catch (error) {
    console.error('[SERVER LOG] Error initializing game settings:', error);
  }
})();


export interface Player {
  // Ensure this Player interface matches what's stored in KV
  id: string;
  playerName: string;
  ratioX: number;
  ratioY: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  score: number;
  team: number; // team index
  wetnessLevel: number;
  wetnessColor: string; // Hex color string for wetness visual
  isGrounded: boolean;
  prevJump: boolean;
  jumpsRemaining: number;
  prevTrigger: boolean; // For throwing balloons (right trigger)
  triggerStart: number | null;
  buttons: boolean[]; // Ensure this is part of the interface
  isUmbrellaOpen: boolean; // Added for umbrella state
  umbrellaAngle: number; // Added for umbrella angle
}

export interface GameObject {
  id: string;
  x: number; // ratioX
  y: number; // ratioY
  vx: number;
  vy: number;
  radius: number; // collision/visual size in ratio units
  ownerId: string; // id of throwing player
  team: number; // team index of owner
  power: number; // throw charge ratio [0,1]
  teamColor: string; // color for rendering balloon
}

// Removed local GameState interface; using types.GameState instead

type MsgInit = { type: 'init'; clientId: string; playerName: string }; // Updated: Added playerName
type MsgInput = {
  type: 'input';
  clientId: string;
  axes: number[];
  buttons: boolean[];
};
type MsgPing = { type: 'ping' };
type MsgLevel = { type: 'level'; levelId: string };
type MsgDisconnect = { type: 'disconnect'; clientId: string };
type MsgRestartGame = { type: 'restart_game' }; // New message type for restarting the game
type IncomingMessage = MsgInit | MsgInput | MsgPing | MsgLevel | MsgRestartGame; // Added MsgRestartGame
// support explicit disconnect messages
type IncomingMessageAll =
  | MsgInit
  | MsgInput
  | MsgPing
  | MsgLevel
  | MsgRestartGame
  | MsgDisconnect;

export function createServer(port: number): {
  server: http.Server;
  wss: WebSocketServer;
  // gameLoopInterval: NodeJS.Timeout; // REMOVE: Game loop will be managed differently
} {
  // console.log('createServer function entered.');
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  // const players = new Map<string, Player>(); // REMOVE: Replaced by KV store for active players
  // const balloons: GameObject[] = []; // REMOVE: Balloons are now in KV
  // let lastTick: number | null = null; // This might be used for calculating dt if physics are event-driven
  const socketClientId = new Map<WebSocket, string>();
  const clientAssociatedControllerIds = new Map<WebSocket, Set<string>>();
  // const disconnectedPlayerStates = new Map<string, Partial<Player>>(); // REMOVE: Player state is in KV

  // Log HTTP server upgrade requests
  server.on('upgrade', (request, socket, head) => {
    // console.log(
    //   `[SERVER LOG] HTTP server 'upgrade' event fired. Request URL: ${request.url}`
    // );
  });

  // Log HTTP server errors
  server.on('error', (err) => {
    // console.error('[SERVER LOG] HTTP server error:', err);
  });

  // Log WebSocketServer errors
  wss.on('error', (err) => {
    // console.error('[SERVER LOG] WebSocketServer (wss) error:', err);
  });

  // console.log("Setting up wss.on('connection') handler.");
  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // console.log(
    //   '[SERVER LOG] Connection handler: ATTEMPTING CONNECTION SETUP.'
    // ); // Very first log

    try {
      let clientRequestUrl = 'unknown_url';
      let clientIp = 'unknown_ip';

      if (req) {
        if (req.url) {
          clientRequestUrl = req.url;
        }
        if (req.socket && req.socket.remoteAddress) {
          clientIp = req.socket.remoteAddress;
        } else if (req.headers && req.headers['x-forwarded-for']) {
          const forwardedIp = req.headers['x-forwarded-for'];
          clientIp = Array.isArray(forwardedIp) ? forwardedIp[0] : forwardedIp;
        }
      }
      // console.log(
      //   `[SERVER LOG] Connection handler: Client IP: ${clientIp}, Request URL: ${clientRequestUrl}`
      // );

      clientAssociatedControllerIds.set(ws, new Set<string>());

      ws.on('message', async (data: WebSocket.Data) => {
        // Make this handler async
        // console.log('[SERVER LOG] Message handler: MESSAGE RECEIVED.');
        try {
          let messageString: string | null = null;
          let processedAsJson = false;

          if (typeof data === 'string') {
            messageString = data;
            // console.log(
            //   `[SERVER LOG] Message handler: Received as STRING data.`
            // );
          } else if (data instanceof ArrayBuffer) {
            // console.log(
            //   '[SERVER LOG] Message handler: Received data as ArrayBuffer.'
            // );
            try {
              messageString = new TextDecoder('utf-8').decode(data);
              // console.log(
              //   `[SERVER LOG] Message handler: Decoded ArrayBuffer to string.`
              // );
            } catch (e) {
              // console.error(
              //   '[SERVER LOG] Message handler: Error decoding ArrayBuffer:',
              //   e
              // );
            }
          } else if (Buffer.isBuffer(data)) {
            // console.log(
            //   '[SERVER LOG] Message handler: Received data as Buffer.'
            // );
            try {
              messageString = data.toString('utf8');
              // console.log(
              //   `[SERVER LOG] Message handler: Decoded Buffer to string.`
              // );
            } catch (e) {
              // console.error(
              //   '[SERVER LOG] Message handler: Error decoding Buffer:',
              //   e
              // );
            }
          } else if (
            Array.isArray(data) &&
            data.length > 0 &&
            data.every((item) => Buffer.isBuffer(item))
          ) {
            // console.log(
            //   '[SERVER LOG] Message handler: Received data as Buffer[].'
            // );
            if (data.length === 1) {
              // Handle if it's a single buffer in an array
              try {
                messageString = (data[0] as Buffer).toString('utf8');
                // console.log(
                //   `[SERVER LOG] Message handler: Decoded Buffer[] (single element) to string.`
                // );
              } catch (e) {
                // console.error(
                //   '[SERVER LOG] Message handler: Error decoding Buffer[] (single element): ',
                //   e
                // );
              }
            } else {
              // console.log(
              //   '[SERVER LOG] Message handler: Received Buffer[] with multiple elements. Forwarding as binary, not attempting JSON parse.'
              // );
              // Explicitly do not set messageString, will fall to binary forwarding
            }
          } else {
            const dataType = Object.prototype.toString.call(data);
            // console.log(
            //   `[SERVER LOG] Message handler: Received data of unhandled type: ${dataType}. Not attempting JSON parse.`
            // );
            // Explicitly do not set messageString, will fall to binary forwarding
          }

          if (messageString !== null) {
            // console.log(
            //   `[SERVER LOG] Message handler: Attempting to parse as JSON (first 200 chars): "${messageString.substring(
            //     0,
            //     200
            //   )}"`
            // );
            try {
              const msg = JSON.parse(messageString) as IncomingMessageAll;
              // console.log(
              //   `[SERVER LOG] Message handler: Successfully parsed message type: ${msg.type}`
              // );
              processedAsJson = true; // Mark that we've handled it as JSON

              const checkedCurrentControllerClientIds =
                clientAssociatedControllerIds.get(ws)!;

              switch (msg.type) {
                case 'init':
                  // console.log(
                  //   `[SERVER LOG] INIT message details: clientId=${msg.clientId}, playerName=${msg.playerName}`
                  // );
                  const controllerId = msg.clientId;
                  checkedCurrentControllerClientIds.add(controllerId);

                  if (!socketClientId.has(ws)) {
                    socketClientId.set(ws, controllerId);
                    // console.log(
                    //   `[SERVER LOG] INIT: Associated WebSocket with primary clientId: ${controllerId}`
                    // );
                  }

                  const playerName =
                    msg.playerName || `Player_${controllerId.substring(0, 4)}`;

                  let playerData: Player | null = await getPlayer(controllerId);

                  if (playerData) {
                    // Player reconnected
                    console.log(
                      `[SERVER LOG] Player ${playerName} (ID: ${controllerId}) reconnected. Current state from KV:`,
                      playerData
                    );
                    // Ensure player is marked as active
                    await addActivePlayer(controllerId);
                    // If you store a 'status' field, update it here
                    // playerData.status = 'active';
                    // await setPlayer(controllerId, playerData);
                  } else {
                    // New player
                    let persistentStats = await getPlayerStats(playerName);
                    if (!persistentStats) {
                      persistentStats = {
                        playerName: playerName,
                        conversions: 0,
                        deathsByConversion: 0,
                        gamesWon: 0,
                      };
                      await setPlayerStats(playerName, persistentStats);
                    }

                    // Determine team with the fewest players
                    const activePlayerIds = await getActivePlayerIds();
                    const activePlayersData = (
                      await Promise.all(
                        activePlayerIds.map((id) => getPlayer(id))
                      )
                    ).filter((p) => p !== null) as Player[];

                    const teamCounts = new Array(TEAM_INFO.length).fill(0);
                    for (const p of activePlayersData) {
                      if (p.team >= 0 && p.team < teamCounts.length) {
                        teamCounts[p.team]++;
                      }
                    }

                    let targetTeamIdx = 0;
                    if (TEAM_INFO.length > 0) {
                      let minPlayers =
                        teamCounts[0] !== undefined ? teamCounts[0] : Infinity;
                      for (let i = 0; i < teamCounts.length; i++) {
                        if (teamCounts[i] < minPlayers) {
                          minPlayers = teamCounts[i];
                          targetTeamIdx = i;
                        }
                      }
                    }
                    const teamIdx = targetTeamIdx;
                    const { ratioX, ratioY } = randomFloorPosition();

                    playerData = initializePlayer(
                      controllerId,
                      playerName,
                      teamIdx,
                      ratioX,
                      ratioY
                    );
                    await setPlayer(controllerId, playerData);
                    await addActivePlayer(controllerId);
                    console.log(
                      `[SERVER LOG] New player ${playerName} (ID: ${controllerId}) initialized and saved to KV.`
                    );
                  }

                  const currentActivePlayerCount = await getActivePlayerCount();
                  let gameSettings = await getGameSettings();
                  if (!gameSettings) {
                    // Should be initialized by IIFE, but as a fallback
                    console.warn(
                      '[SERVER LOG] Game settings not found during init, re-initializing.'
                    );
                    gameSettings = await initializeDefaultGameSettings(
                      TEAM_INFO.map((t) => t.name)
                    );
                  }

                  if (
                    currentActivePlayerCount === 1 &&
                    gameSettings &&
                    gameSettings.gameOver
                  ) {
                    console.log(
                      '[SERVER LOG] First player joined a game over state. Resetting game settings in KV.'
                    );
                    gameSettings.gameOver = false;
                    gameSettings.winningTeam = null;
                    gameSettings.teamScores = new Array(TEAM_INFO.length).fill(
                      0
                    );
                    // gameSettings.nextTeam = 0; // nextTeam is for restart team assignment, not necessarily reset here
                    await setGameSettings(gameSettings);
                    await clearBalloons(); // Also clear balloons for a fresh game
                  }
                  await broadcastGameState(); // Broadcast initial state
                  break;

                case 'restart_game':
                  console.log('[SERVER LOG] RESTART_GAME message received.');
                  let settingsToRestart = await getGameSettings();
                  if (!settingsToRestart) {
                    console.warn(
                      '[SERVER LOG] Game settings not found during restart, initializing.'
                    );
                    settingsToRestart = await initializeDefaultGameSettings(
                      TEAM_INFO.map((t) => t.name)
                    );
                  } else {
                    settingsToRestart.gameOver = false;
                    settingsToRestart.winningTeam = null;
                    settingsToRestart.teamScores = new Array(
                      TEAM_INFO.length
                    ).fill(0);
                    settingsToRestart.nextTeam = 0; // Reset for team assignment
                  }
                  await setGameSettings(settingsToRestart);
                  await clearBalloons(); // Clear all balloons from KV

                  const allActivePlayerIdsForRestart =
                    await getActivePlayerIds();
                  let tempNextTeamRestart = 0; // Use the nextTeam from settings after reset
                  for (const pId of allActivePlayerIdsForRestart) {
                    const p_orig = await getPlayer(pId);
                    if (p_orig) {
                      const { ratioX, ratioY } = randomFloorPosition(); // Give new random positions
                      const updatedPlayer = initializePlayer(
                        p_orig.id,
                        p_orig.playerName,
                        settingsToRestart.nextTeam % TEAM_INFO.length,
                        ratioX, // Reset position
                        ratioY // Reset position
                      );
                      await setPlayer(pId, updatedPlayer);
                      settingsToRestart.nextTeam =
                        (settingsToRestart.nextTeam + 1) % TEAM_INFO.length;
                    }
                  }
                  await setGameSettings(settingsToRestart); // Save nextTeam changes
                  console.log(
                    'Game state reset complete in KV, players reassigned to teams in KV'
                  );
                  await broadcastGameState();
                  break;

                case 'input':
                  const playerForInput = await getPlayer(msg.clientId);
                  if (playerForInput) {
                    const p = playerForInput; // Already a mutable copy from JSON parse (if getPlayer returns plain object)
                    p.buttons = msg.buttons;
                    const horizSpeed = MOVE_SPEED / HALF_W;
                    p.vx = msg.axes[0] * horizSpeed;
                    p.aimX = msg.axes[2] ?? 0;
                    p.aimY = msg.axes[3] ?? 0;

                    const leftTriggerPressed = p.buttons[6];
                    p.isUmbrellaOpen = leftTriggerPressed;

                    if (p.isUmbrellaOpen) {
                      if (
                        Math.abs(p.aimX) < DEAD_ZONE &&
                        Math.abs(p.aimY) < DEAD_ZONE
                      ) {
                        p.umbrellaAngle = UMBRELLA_DEFAULT_ANGLE;
                      } else {
                        p.umbrellaAngle = Math.atan2(p.aimY, p.aimX);
                      }
                    }

                    if (msg.buttons[1] && !p.prevJump && p.jumpsRemaining > 0) {
                      p.vy = JUMP_VELOCITY * JUMP_MULTIPLIER;
                      p.isGrounded = false;
                      p.jumpsRemaining--;
                    }
                    p.prevJump = msg.buttons[1];

                    const rightTriggerPressed = p.buttons[7];
                    if (
                      rightTriggerPressed &&
                      !p.prevTrigger &&
                      !p.isUmbrellaOpen
                    ) {
                      p.triggerStart = Date.now();
                    }

                    if (
                      !rightTriggerPressed &&
                      p.prevTrigger &&
                      p.triggerStart &&
                      !p.isUmbrellaOpen
                    ) {
                      const now = Date.now();
                      const start = p.triggerStart ?? now;
                      const hold = Math.min(now - start, MAX_CHARGE_TIME);
                      const throwPower = hold / MAX_CHARGE_TIME;
                      p.triggerStart = null;
                      const aimMagnitude = Math.sqrt(
                        p.aimX * p.aimX + p.aimY * p.aimY
                      );
                      if (aimMagnitude > DEAD_ZONE) {
                        const spawnOffsetX_ratio =
                          p.aimX * (AIM_OFFSET_PX_CONST / HALF_W);
                        const spawnOffsetY_ratio =
                          p.aimY * (AIM_OFFSET_PX_CONST / HALF_H);
                        const spawnX = p.ratioX + spawnOffsetX_ratio;
                        const spawnY = p.ratioY + spawnOffsetY_ratio;
                        const effectivePower = (0.5 + throwPower * 0.5) * 1.4;
                        const baseSpeed = THROW_SPEED * effectivePower;

                        // Get current balloons from KV, add new one, set them back
                        let currentBalloons = await getBalloons();
                        currentBalloons.push({
                          id: `${msg.clientId}-${now}`,
                          x: spawnX,
                          y: spawnY,
                          vx: p.vx + p.aimX * baseSpeed,
                          vy: p.vy + p.aimY * baseSpeed,
                          radius: BALLOON_RADIUS_RATIO,
                          ownerId: msg.clientId,
                          team: p.team,
                          teamColor: p.wetnessColor, // This should ideally be TEAM_INFO[p.team].hex
                          power: throwPower,
                        });
                        await setBalloons(currentBalloons);
                      }
                    }
                    p.prevTrigger = rightTriggerPressed;
                    await setPlayer(msg.clientId, p); // Save updated player state to KV
                    // Physics update for this player would happen here or be triggered
                    // For now, only direct input effects are saved.
                    // Consider if a broadcast is needed immediately on input or batched.
                    // For responsive feel, important state changes (like throwing) might warrant a broadcast.
                    // However, frequent broadcasts can be heavy.
                    // Let's assume the main physics loop (to be designed) will handle regular broadcasts.
                  }
                  break;

                case 'disconnect':
                  // This handles a message of type 'disconnect' sent by the client.
                  // console.log(
                  //   `[SERVER LOG] DISCONNECT message received for clientId: ${msg.clientId}`
                  // );
                  // Note: Actual player removal and state saving happens in ws.on('close').
                  // You might want to trigger a graceful close from the server side here if needed.
                  // For example: ws.close(1000, "Client requested disconnect");
                  break; // Added break to prevent fall-through

                case 'ping':
                  // Client might send pings to keep connection alive or check latency.
                  // console.log(`[SERVER LOG] PING message received. ClientID: ${msg.clientId || 'N/A'}`);
                  // Optionally, send a 'pong' back. For now, just acknowledging.
                  break;

                default:
                  const unhandledMsg: any = msg;
                // console.log(
                //   `[SERVER LOG] Message handler: Unknown or unhandled message type: ${unhandledMsg.type}`
                // );
              }
            } catch (parseError) {
              // console.error(
              //   '[SERVER LOG] Message handler: Error parsing message JSON:',
              //   parseError,
              //   'Original string data (first 500 chars):',
              //   messageString.substring(0, 500)
              // );
              // If parsing fails, do not attempt to forward as binary, as it was intended to be JSON.
            }
          }

          // If messageString was null (e.g. unhandled binary type, or multi-buffer array) OR if it wasn't processed as JSON (e.g. parse error, though we might not want to forward that)
          // For now, only forward if it was never intended to be JSON (messageString remained null) or if it was explicitly a multi-buffer array.
          if (
            !processedAsJson &&
            (messageString === null || (Array.isArray(data) && data.length > 1))
          ) {
            const dataType = Object.prototype.toString.call(data);
            let length = 0;
            if (data instanceof ArrayBuffer) length = data.byteLength;
            else if (Buffer.isBuffer(data)) length = data.length;
            else if (Array.isArray(data))
              length = (data as Buffer[]).reduce(
                (acc, buf) => acc + buf.length,
                0
              ); // Assuming Buffer[] based on earlier checks

            // console.log(
            //   `[SERVER LOG] Message handler: Forwarding as BINARY data. Original type: ${dataType}. Length: ${length}.`
            // );
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data); // Forward original binary data
              }
            });
          }
        } catch (messageProcessingError) {
          // console.error(
          //   '[SERVER LOG] Message handler: CRITICAL ERROR during message processing (outer try-catch):',
          //   messageProcessingError
          // );
        }
      });

      ws.on('close', async (code: number, reason: Buffer) => {
        // Make this handler async
        const reasonString = reason.toString();
        const primaryId = socketClientId.get(ws);
        const controllerIdsSet = clientAssociatedControllerIds.get(ws);

        console.log(
          `[SERVER LOG] Close handler: Connection closed. Code: ${code}, Reason: "${reasonString}". Primary ID: ${
            primaryId || 'N/A'
          }. Associated controller IDs: ${
            controllerIdsSet ? Array.from(controllerIdsSet).join(', ') : 'N/A'
          }`
        );

        if (controllerIdsSet) {
          for (const controllerId of controllerIdsSet) {
            // Use for...of for async operations
            const playerWhoLeft = await getPlayer(controllerId); // Get player from KV
            if (playerWhoLeft) {
              console.log(
                `[SERVER LOG] Player ${playerWhoLeft.playerName} (ID: ${controllerId}) disconnecting. Code: ${code}, Reason: "${reasonString}". Removing from active set.`
              );
              // Player state remains in KV, just remove from active set
              await removeActivePlayer(controllerId);
              // Optionally, update a 'status' field in the player object in KV to 'disconnected'
              // playerWhoLeft.status = 'disconnected';
              // await setPlayer(controllerId, playerWhoLeft);
              const currentActivePlayerCount = await getActivePlayerCount();
              console.log(
                `[SERVER LOG] Player ${playerWhoLeft.playerName} (ID: ${controllerId}) marked inactive. Remaining active players: ${currentActivePlayerCount}`
              );
            } else {
              console.log(
                `[SERVER LOG] Close handler: No player found in KV for controllerId ${controllerId} during cleanup. Code: ${code}, Reason: "${reasonString}".`
              );
            }
          }
        } else {
          console.log(
            `[SERVER LOG] Close handler: Connection closed, but no controller IDs were associated with this WebSocket. Code: ${code}, Reason: "${reasonString}". Primary ID (if any was set): ${
              primaryId || 'N/A'
            }`
          );
        }

        socketClientId.delete(ws);
        clientAssociatedControllerIds.delete(ws);

        const currentActivePlayerCountAfterClose = await getActivePlayerCount();
        if (currentActivePlayerCountAfterClose === 0) {
          console.log(
            '[SERVER LOG] All players disconnected. Resetting game session variables (scores, game over state) in KV.'
          );
          let settingsOnClose = await getGameSettings();
          if (settingsOnClose) {
            settingsOnClose.teamScores = new Array(TEAM_INFO.length).fill(0);
            settingsOnClose.gameOver = false;
            settingsOnClose.winningTeam = null;
            settingsOnClose.nextTeam = 0;
            // teamSessionWins are part of GameSettings and will persist unless explicitly reset
            await setGameSettings(settingsOnClose);
            await clearBalloons(); // Clear balloons when server is empty
            console.log(
              '[SERVER LOG] Game settings and balloons reset in KV as server is empty.'
            );
          } else {
            console.warn(
              '[SERVER LOG] Could not find game settings to reset on close.'
            );
            // Fallback: try to initialize if somehow they were never set
            await initializeDefaultGameSettings(TEAM_INFO.map((t) => t.name));
            await clearBalloons();
          }
        }
        await broadcastGameState(); // Notify remaining clients of player departure
      });

      ws.on('error', (err) => {
        console.error(
          '[SERVER LOG] Error handler on ws: WebSocket error on client connection:',
          err
        );
      });
    } catch (e) {
      // console.error(
      //   '[SERVER LOG] Connection handler: CRITICAL ERROR in wss.on("connection") outer try-catch block:',
      //   e
      // );
    }
  });

  // Start the server
  // server.listen(port, () => {
  //   console.log(`Server listening on port ${port}`);
  // });

  // Use Vercel's PORT environment variable if available, otherwise use the provided port
  // const vercelPort = parseInt(process.env.PORT || port.toString(), 10);
  // server.listen(vercelPort, () => {
  //   console.log(`[SERVER LOG] Server listening on port ${vercelPort}`);
  // });
  // The server listening is handled by the default export for Vercel

  // console.log('Setting up main game loop (setInterval)...'); // Existing log
  // const gameLoopInterval = setInterval(() => { // REMOVE: Game loop needs re-architecture
  // ... entire game loop logic ...
  // }, 16);

  // return { server, wss, gameLoopInterval }; // REMOVE gameLoopInterval
  return { server, wss };
}

// New function to fetch all active players and broadcast game state
async function broadcastGameState() {
  try {
    const activePlayerIds = await getActivePlayerIds();
    const playersData = (
      await Promise.all(activePlayerIds.map((id) => getPlayer(id)))
    ).filter((p) => p !== null) as Player[];

    const currentBalloons = await getBalloons(); // Fetch balloons from KV
    let currentGameSettings = await getGameSettings();

    if (!currentGameSettings) {
      console.warn(
        '[SERVER LOG] Game settings not found in broadcastGameState, attempting to initialize.'
      );
      currentGameSettings = await initializeDefaultGameSettings(
        TEAM_INFO.map((t) => t.name)
      );
      // No need to save here, initializeDefaultGameSettings does that.
      // This is a fallback; settings should ideally always exist.
    }

    const persistentPlayerStatsArray = await getAllPlayerStats();

    const gameState: types.GameState = {
      players: playersData,
      balloons: currentBalloons,
      teamScores: currentGameSettings.teamScores,
      friendlyFireEnabled: currentGameSettings.friendlyFireEnabled,
      gameOver: currentGameSettings.gameOver,
      winningTeam: currentGameSettings.winningTeam,
      persistentPlayerStats: persistentPlayerStatsArray,
      teamSessionWins: currentGameSettings.teamSessionWins,
      teamNames: TEAM_INFO.map((t) => t.name),
      tilemap: null, // Tilemap is explicitly null
    };

    const wssInstance = serverInstance?.wss;
    if (wssInstance) {
      wssInstance.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'state', state: gameState }));
        }
      });
    } else {
      console.error(
        '[SERVER LOG] WSS instance not available for broadcastGameState'
      );
    }
  } catch (error) {
    console.error('[SERVER LOG] Error in broadcastGameState:', error);
  }
}

// Get port from environment variable or default to 8080
// const port = parseInt(process.env.PORT || '8080', 10);

// Create and start the server
// const { server, wss } = createServer(port); // wss is now part of serverInstance

// The createServer function, as previously modified, will use
// process.env.PORT if available, or the port provided here as a fallback.
const portForServer = parseInt(process.env.PORT || '8080', 10); // Default port for local execution if process.env.PORT is not set
const serverInstance = createServer(portForServer); // Capture the instance { server, wss }

// server.listen(port, () => { // This is handled by the default export for Vercel
//   // console.log(`[SERVER LOG] Server listening on port ${port}`);
// });

// Handle process termination to clean up the interval
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  // if (gameLoopInterval) clearInterval(gameLoopInterval); // REMOVE: gameLoopInterval removed
  if (serverInstance && serverInstance.server) {
    serverInstance.server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0); // Exit if serverInstance wasn't fully set up
  }
});

export default serverInstance.server; // Export the http.Server instance for Vercel