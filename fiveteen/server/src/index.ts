import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as types from './types/index';
import type {
  GameConstants,
  Player,
  GameObject,
  GameSettings,
  PlayerPersistentStats,
  TeamInfo as TeamInfoType,
} from './types/index';
import {
  initializePlayer,
  randomFloorPosition,
  updateSinglePlayerPhysics, // Import these when ready
  updateBalloons,
  handleCollisions,
} from './functions/index';
import {
  // kv, // Removed kv import
  getPlayer,
  setPlayer,
  deletePlayer, // This was not used but kept for consistency if needed later
  getPlayerStats,
  setPlayerStats,
  getAllPlayerStats,
  addActivePlayer,
  removeActivePlayer,
  getActivePlayerIds,
  getActivePlayerCount,
  getBalloons,
  setBalloons,
  clearBalloons,
  getGameSettings,
  setGameSettings,
  initializeDefaultGameSettings,
  // Added disconnectRedis for potential graceful shutdown
  disconnectRedis,
} from './kvStore';

// Define all game constants in one place
const gameConstants: GameConstants = {
  LEVEL_WIDTH: 1000,
  LEVEL_HEIGHT: 600,
  get HALF_W() {
    return this.LEVEL_WIDTH / 2;
  }, // Use getter for derived constants
  get HALF_H() {
    return this.LEVEL_HEIGHT / 2;
  },
  PLAYER_RADIUS_PX: 20,
  AIM_OFFSET_PX_CONST: 38,
  MAX_JUMPS_CONST: 2,
  get PLAYER_RADIUS_RATIO_X() {
    return this.PLAYER_RADIUS_PX / this.HALF_W;
  },
  get PLAYER_RADIUS_RATIO_Y() {
    return this.PLAYER_RADIUS_PX / this.HALF_H;
  },
  POINTS_TO_WIN: 10,
  get MAX_RATIO_X() {
    return 1 - this.PLAYER_RADIUS_PX / this.HALF_W;
  },
  get MAX_RATIO_Y() {
    return 1 - this.PLAYER_RADIUS_PX / this.HALF_H;
  },
  GRAVITY: 10,
  JUMP_VELOCITY: -1.5,
  THROW_SPEED: 2,
  DEAD_ZONE: 0.1,
  MAX_CHARGE_TIME: 1000,
  MAX_WETNESS: 100,
  WETNESS_PER_HIT: 25, // Changed from 10 to 25
  PLAYER_DRYING_RATE_CONST: 10, // Changed from 1 to 10
  TERMINAL_VELOCITY_CONST: 2.5,
  UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER: 0.85,
  UMBRELLA_DEFAULT_ANGLE: -Math.PI / 2,
  get UMBRELLA_WIDTH_RATIO() {
    return (this.PLAYER_RADIUS_PX * 2.5) / this.HALF_W;
  },
  get UMBRELLA_HEIGHT_RATIO() {
    return (this.PLAYER_RADIUS_PX * 0.5) / this.HALF_H;
  },
  get UMBRELLA_OFFSET_Y_RATIO() {
    return (this.PLAYER_RADIUS_PX + 5) / this.HALF_H;
  },
  get UMBRELLA_TERMINAL_VELOCITY() {
    return this.TERMINAL_VELOCITY_CONST * 0.7;
  },
  UMBRELLA_GRAVITY_MULTIPLIER: 0.5,
  PLAYER_HEIGHT_RATIO: 0.1, // This was 0.1, ensure it's relative to player model if changed
  BASE_MOVE_SPEED: 200, // Added missing property
  MOVE_SPEED: 350, // Base move speed in px/s, will need to be converted to ratio units/sec in logic
  JUMP_MULTIPLIER: 3,
  BALLOON_RADIUS_PX: 8,
  get BALLOON_RADIUS_RATIO() {
    return this.BALLOON_RADIUS_PX / this.HALF_W;
  },
  get COLLISION_RADIUS() {
    return this.PLAYER_RADIUS_RATIO_X;
  }, // Example, might be PLAYER_RADIUS_PX / HALF_W
  UMBRELLA_MAX_REACH_MULTIPLIER: 3.0, // Restored from constants/index.ts
  BASE_UMBRELLA_DISTANCE_RATIO: 0.09, // Updated from constants/index.ts
  UMBRELLA_SPREAD_ANGLE: Math.PI * 0.8, // Added from constants/index.ts
};

const FIXED_DELTA_TIME = 1 / 60; // Added for physics updates
const GAME_TICK_MS = 16; // Target ~60 FPS game loop

// Team Info (remains as is, but ensure type consistency)
const TEAM_INFO: TeamInfoType[] = [
  { id: 0, hexColor: '#f00', name: 'Raging Reds', cssColor: 'red' }, // Changed hex to hexColor, added id
  { id: 1, hexColor: '#00f', name: 'Brave Blues', cssColor: 'blue' }, // Changed hex to hexColor, added id
];

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
        TEAM_INFO.map((t: TeamInfoType) => t.name) // Corrected type
      );
    }
    // console.log('[SERVER LOG] Game settings loaded/initialized:', settings);
  } catch (error) {
    console.error('[SERVER LOG] Error initializing game settings:', error);
  }
})();

type MsgInit = { type: 'init'; clientId: string; playerName: string }; // Updated: Added playerName
type MsgInput = {
  type: 'input';
  clientId: string;
  input: {
    // Added nested input object
    axes: number[];
    buttons: boolean[];
  };
  deltaTime: number; // Added: time since client's last input processing cycle, in seconds
};
type MsgPing = { type: 'ping' }
type MsgLevel = { type: 'level'; levelId: string }
type MsgDisconnect = { type: 'disconnect'; clientId: string }
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
              processedAsJson = true; // Mark that we\\\'ve handled it as JSON

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
                    let persistentStats: PlayerPersistentStats | null =
                      await getPlayerStats(playerName); // Added type
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
                        activePlayerIds.map((id: string) => getPlayer(id)) // Added type for id
                      )
                    ).filter((p: Player | null) => p !== null) as Player[]; // Added type for p

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
                    // Use gameConstants for randomFloorPosition
                    const { ratioX, ratioY } =
                      randomFloorPosition(gameConstants);

                    playerData = initializePlayer(
                      controllerId,
                      playerName,
                      teamIdx,
                      ratioX,
                      ratioY,
                      gameConstants, // Pass gameConstants
                      TEAM_INFO[teamIdx].hexColor // Pass team color hexColor
                    );
                    await setPlayer(controllerId, playerData);
                    await addActivePlayer(controllerId);
                    console.log(
                      `[SERVER LOG] New player ${playerName} (ID: ${controllerId}) initialized and saved to KV.`
                    );
                  }

                  // const currentActivePlayerCount = await getActivePlayerCount(); // This line is no longer needed here
                  // let gameSettings = await getGameSettings(); // This line is no longer needed here
                  // if (!gameSettings) {
                  // // Should be initialized by IIFE, but as a fallback
                  // console.warn(
                  //   '[SERVER LOG] Game settings not found during init, re-initializing.'
                  // );
                  // gameSettings = await initializeDefaultGameSettings(
                  //   TEAM_INFO.map((t) => t.name)
                  // );
                  // }

                  // REMOVED: Automatic game reset when first player joins a gameOver state.
                  // The game should remain in its current state (gameOver or not)
                  // until an explicit 'restart_game' message is received.
                  // if (
                  //   currentActivePlayerCount === 1 &&
                  //   gameSettings &&
                  //   gameSettings.gameOver
                  // ) {
                  //   console.log(
                  //     '[SERVER LOG] First player joined a game over state. Resetting game settings in KV.'
                  //   );
                  //   gameSettings.gameOver = false;
                  //   gameSettings.winningTeam = null;
                  //   gameSettings.teamScores = new Array(TEAM_INFO.length).fill(
                  //     0
                  //   );
                  //   await setGameSettings(gameSettings);
                  //   await clearBalloons();
                  // }
                  await broadcastGameState(); // Broadcast initial state
                  break;

                case 'restart_game':
                  console.log('[SERVER LOG] RESTART_GAME message received.');
                  let settingsToRestart: GameSettings | null =
                    await getGameSettings(); // Added type
                  if (!settingsToRestart) {
                    console.warn(
                      '[SERVER LOG] Game settings not found during restart, initializing.'
                    );
                    settingsToRestart = await initializeDefaultGameSettings(
                      TEAM_INFO.map((t: TeamInfoType) => t.name) // Added type for t
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
                      // Use gameConstants for randomFloorPosition
                      const { ratioX, ratioY } =
                        randomFloorPosition(gameConstants);
                      const updatedPlayer = initializePlayer(
                        p_orig.id,
                        p_orig.playerName,
                        settingsToRestart.nextTeam % TEAM_INFO.length,
                        ratioX,
                        ratioY,
                        gameConstants, // Pass gameConstants
                        TEAM_INFO[settingsToRestart.nextTeam % TEAM_INFO.length]
                          .hexColor // Pass team color hexColor
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
                  // console.log(
                  //   `[SERVER LOG] INPUT message for clientId: ${msg.clientId}`
                  // );
                  const playerForInput = await getPlayer(msg.clientId);
                  if (playerForInput) {
                    // console.log(
                    //   `[SERVER LOG] INPUT: Player ${playerForInput.playerName} found. Storing input state.`
                    // );

                    const receivedButtons = msg.input.buttons;
                    const receivedAxes = msg.input.axes;
                    // const clientDeltaTime = msg.deltaTime; // No longer used here

                    // console.log(
                    //   `[SERVER LOG] Received input message for clientId: ${msg.clientId} with deltaTime: ${clientDeltaTime}`
                    // );
                    // console.log(
                    //   `[SERVER LOG] Buttons: ${JSON.stringify(
                    //     receivedButtons
                    //   )}, Axes: ${JSON.stringify(receivedAxes)}`
                    // );

                    // Store the latest input state on the player object
                    playerForInput.buttons = receivedButtons;
                    playerForInput.axes = receivedAxes; // Store all axes
                    playerForInput.aimX = receivedAxes[2] ?? 0; // Keep aimX/Y for direct access if needed elsewhere
                    playerForInput.aimY = receivedAxes[3] ?? 0;

                    // Update the player in KV store with the new input state
                    await setPlayer(msg.clientId, playerForInput);

                    // console.log(
                    //   `[SERVER LOG] Player ${playerForInput.playerName} (ID: ${msg.clientId}) input state updated in KV.`
                    // );

                    // Physics update and balloon launching are now handled by the gameLoop
                    // No direct call to updateSinglePlayerPhysics or balloon management here.
                  } else {
                    console.log(
                      `[SERVER LOG] ERROR: Player with clientId ${msg.clientId} not found during input processing.`
                    );
                  }
                  // Do not broadcast game state here; gameLoop will do it at a fixed rate.
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
                  console.log(
                    `[SERVER LOG] Message handler: Unknown or unhandled message type: ${unhandledMsg.type}`
                  );
              }
            } catch (parseError) {
              console.error(
                '[SERVER LOG] Message handler: Error parsing message JSON:',
                parseError,
                'Original string data (first 500 chars):',
                messageString.substring(0, 500)
              );
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
          `[SERVER LOG] Close handler: Connection closed. Code: ${code}, Reason: \\"${reasonString}\\". Primary ID: ${
            primaryId || 'N/A'
          }. Associated controller IDs: ${
            controllerIdsSet ? Array.from(controllerIdsSet).join(', ') : 'N/A'
          }`
        );

        if (controllerIdsSet) {
          for (const controllerId of controllerIdsSet) {
            // Use for...of for async operations
            const playerWhoLeft: Player | null = await getPlayer(controllerId); // Get player from KV, added type
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
          let settingsOnClose: GameSettings | null = await getGameSettings(); // Added type
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
            await initializeDefaultGameSettings(
              TEAM_INFO.map((t: TeamInfoType) => t.name)
            ); // Added type for t
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
      await Promise.all(activePlayerIds.map((id: string) => getPlayer(id)))
    ) // Added type for id
      .filter((p: Player | null) => p !== null) as Player[]; // Assert Player[] type, Added type for p

    const currentBalloons: GameObject[] = await getBalloons(); // Fetch balloons from KV, Added type
    let currentGameSettings: GameSettings | null = await getGameSettings(); // Added type

    if (!currentGameSettings) {
      console.warn(
        '[SERVER LOG] Game settings not found in broadcastGameState, attempting to initialize.'
      );
      currentGameSettings = await initializeDefaultGameSettings(
        TEAM_INFO.map((t: TeamInfoType) => t.name) // Changed type for t to TeamInfoType
      );
      // No need to save here, initializeDefaultGameSettings does that.
      // This is a fallback; settings should ideally always exist.
    }

    const persistentPlayerStatsArray: PlayerPersistentStats[] =
      await getAllPlayerStats(); // Added type

    const gameState: types.GameState = {
      players: playersData,
      balloons: currentBalloons,
      teamScores: currentGameSettings.teamScores,
      friendlyFireEnabled: currentGameSettings.friendlyFireEnabled, // This comes from GameSettings in KV
      gameOver: currentGameSettings.gameOver,
      winningTeam: currentGameSettings.winningTeam,
      persistentPlayerStats: persistentPlayerStatsArray,
      teamSessionWins: currentGameSettings.teamSessionWins, // This comes from GameSettings in KV
      teamNames: TEAM_INFO.map((t) => t.name),
      tilemap: null, // Tilemap is explicitly null
    };

    const wssInstance = serverInstance?.wss;
    if (wssInstance) {
      wssInstance.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log(
            `[SERVER LOG] Broadcasting game state with ${playersData.length} players and ${currentBalloons.length} balloons`
          );
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

// Global variable to hold the server instance, primarily for WSS access in broadcastGameState
let serverInstance: { server: http.Server; wss: WebSocketServer } | null = null;

// Main function to create and start the server
function main() {
  const port = parseInt(process.env.PORT || '3001', 10);
  serverInstance = createServer(port); // Assign to global instance

  serverInstance.server.listen(port, () => {
    console.log(`[SERVER LOG] Server listening on port ${port}`);
    gameLoop(); // Start the game loop
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[SERVER LOG] SIGINT received, shutting down gracefully...');
    if (serverInstance) {
      serverInstance.wss.clients.forEach((client) => client.close());
      serverInstance.server.close(async () => {
        console.log('[SERVER LOG] HTTP server closed.');
        await disconnectRedis(); // Disconnect Redis client
        process.exit(0);
      });
    } else {
      await disconnectRedis(); // Disconnect Redis client
      process.exit(0);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('[SERVER LOG] SIGTERM received, shutting down gracefully...');
    if (serverInstance) {
      serverInstance.wss.clients.forEach((client) => client.close());
      serverInstance.server.close(async () => {
        console.log('[SERVER LOG] HTTP server closed.');
        await disconnectRedis(); // Disconnect Redis client
        process.exit(0);
      });
    } else {
      await disconnectRedis(); // Disconnect Redis client
      process.exit(0);
    }
  });
}

// Ensure the server starts when the script is executed
// This replaces the Vercel-specific default export.
if (require.main === module) {
  main();
}

// Export createServer for potential programmatic use if needed,
// but the primary execution path is now through main().
// For Vercel, the default export is usually an http.Server instance or a request handler.
// Since we are moving to Docker, we control the server startup.
// export default serverInstance?.server; // This might not be needed or work as expected outside Vercel.
// Consider removing if not specifically required for some deployment target.

// If you need to export the server for a specific framework or entry point, adjust accordingly.
// For a simple Node.js Docker deployment, running main() is sufficient.

async function gameLoop() {
  const startTime = Date.now();
  // console.log('[SERVER LOG] Game loop iteration started.');

  try {
    let gameSettings = await getGameSettings();

    if (gameSettings && !gameSettings.gameOver) {
      // Main game logic only if game is active
      const activePlayerIds = await getActivePlayerIds();
      let playersForLoop = (
        await Promise.all(activePlayerIds.map((id: string) => getPlayer(id)))
      ).filter((p: Player | null) => p !== null) as Player[];

      let balloonsForLoop = (await getBalloons()) || []; // Ensure it's an array

      const allNewBalloonsThisLoop: GameObject[] = [];
      const updatedPlayersThisLoop: Player[] = [];

      // Update individual player physics for all active players
      for (const currentPlayer of playersForLoop) {
        const playerSpecificNewBalloons: GameObject[] = [];
        // For the game loop\'s continuous physics update:
        // - Use currentPlayer.buttons (last state from input handler)
        // - Use currentPlayer.axes (last state from input handler for movement and aim)

        const updatedPlayer = updateSinglePlayerPhysics(
          currentPlayer,
          currentPlayer.buttons, // Buttons from last input
          currentPlayer.axes, // Axes from last input (includes movement and aim)
          FIXED_DELTA_TIME, // Use fixed delta time for server game loop
          gameConstants,
          playerSpecificNewBalloons
        );
        updatedPlayersThisLoop.push(updatedPlayer);
        allNewBalloonsThisLoop.push(...playerSpecificNewBalloons);
      }

      // Persist updated player states to KV store
      if (updatedPlayersThisLoop.length > 0) {
        await Promise.all(
          updatedPlayersThisLoop.map((p) => setPlayer(p.id, p))
        );
      }
      // Use the players that were just updated for subsequent logic in this loop iteration
      playersForLoop = updatedPlayersThisLoop;

      // Add any balloons launched during player physics updates to the main list
      if (allNewBalloonsThisLoop.length > 0) {
        balloonsForLoop = balloonsForLoop.concat(allNewBalloonsThisLoop);
      }

      // Update balloon physics (movement, etc.)
      // updateBalloons is expected to be synchronous and return the modified list.
      balloonsForLoop = updateBalloons(
        balloonsForLoop,
        FIXED_DELTA_TIME,
        gameConstants
      );
      await setBalloons(balloonsForLoop); // Persist updated balloons

      // Handle collisions and game rules, then persist results
      const collisionResult = await handleCollisions(
        playersForLoop,
        balloonsForLoop,
        gameSettings,
        await getAllPlayerStats(),
        gameConstants,
        TEAM_INFO
      );
      // Persist updated players
      await Promise.all(
        collisionResult.updatedPlayers.map((p) => setPlayer(p.id, p))
      );
      // Persist updated balloons
      await setBalloons(collisionResult.updatedBalloons);
      // Persist updated game settings
      await setGameSettings(collisionResult.updatedGameSettings);
      // Persist updated persistent stats
      await Promise.all(
        collisionResult.updatedStats.map((s) => setPlayerStats(s.playerName, s))
      );
      // collisionResult.gameSettings has been persisted, broadcastGameState will fetch latest from KV.
    } else if (!gameSettings) {
      console.warn(
        '[SERVER LOG] Game loop: Game settings not found. Game logic skipped.'
      );
      // Attempt to initialize settings if they are missing, as a fallback
      await initializeDefaultGameSettings(
        TEAM_INFO.map((t: TeamInfoType) => t.name)
      );
    } else {
      // Game is over, logic is skipped.
      // console.log('[SERVER LOG] Game loop: Game is over. Game logic skipped.');
    }
  } catch (error) {
    console.error('[SERVER LOG] Error in game loop:', error);
  } finally {
    // Ensure broadcastGameState is called even if there were errors in the try block,
    // unless the error is catastrophic and prevents broadcasting.
    // console.log('[SERVER LOG] Game loop: Attempting to broadcast game state in finally block.');
    await broadcastGameState(); // Call broadcastGameState at the end of each iteration

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const nextTickDelay = Math.max(0, GAME_TICK_MS - elapsedTime);
    // console.log(
    //   `[SERVER LOG] Game loop iteration finished. Elapsed time: ${elapsedTime}ms. Next tick in: ${nextTickDelay}ms.`
    // );
    setTimeout(gameLoop, nextTickDelay);
  }
}