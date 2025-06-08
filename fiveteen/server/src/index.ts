import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as types from './types/index';
import {
  initializePlayer,
  randomFloorPosition,
  updateGamePhysics,
} from './functions/index'; // Added updateGamePhysics

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

let nextTeam = 0;
let friendlyFireEnabled = false; // Added: Friendly fire toggle
const teamScores = [0, 0]; // Added: Team scores for the current game
let gameOver = false; // New: Game over state
let winningTeam: number | null = null; // New: Winning team

// Persistent Stats
interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}
const playerPersistentStats = new Map<string, PlayerPersistentStats>();
const teamSessionWins = [0, 0]; // Tracks total games won by each team in the session

export interface Player {
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
  gameLoopInterval: NodeJS.Timeout; // Added gameLoopInterval to return type
} {
  // console.log('createServer function entered.');
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  const players = new Map<string, Player>();
  const balloons: GameObject[] = [];
  let lastTick: number | null = null;
  const socketClientId = new Map<WebSocket, string>();
  const clientAssociatedControllerIds = new Map<WebSocket, Set<string>>();
  const disconnectedPlayerStates = new Map<string, Partial<Player>>();

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
      // console.log(
      //   '[SERVER LOG] Connection handler: clientAssociatedControllerIds map entry created.'
      // );

      ws.on('message', (data: WebSocket.Data) => {
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

                  // Inline initializePlayer logic from the original createServer scope
                  // This function was previously defined inside createServer, then moved to functions/index.ts
                  // For this specific use, ensure all constants are available or passed if it were external.
                  // Based on current structure, it seems it's imported from ./functions/index
                  // So, the call to the imported initializePlayer should be fine.

                  if (disconnectedPlayerStates.has(controllerId)) {
                    const prevState =
                      disconnectedPlayerStates.get(controllerId)!;
                    players.set(
                      controllerId,
                      initializePlayer(
                        // Calling imported function
                        controllerId,
                        playerName,
                        prevState.team !== undefined
                          ? prevState.team
                          : nextTeam % TEAM_INFO.length,
                        prevState.ratioX !== undefined
                          ? prevState.ratioX
                          : randomFloorPosition().ratioX, // Use randomFloorPosition for safety
                        prevState.ratioY !== undefined
                          ? prevState.ratioY
                          : randomFloorPosition().ratioY // Use randomFloorPosition for safety
                      )
                    );
                    disconnectedPlayerStates.delete(controllerId);
                    // console.log(
                    //   `[SERVER LOG] Player ${playerName} (ID: ${controllerId}) reconnected.`
                    // );
                    // console.log(
                    //   '[SERVER LOG] Players map after reconnecting player:',
                    //   JSON.stringify(Array.from(players.entries()))
                    // );
                  } else if (!players.has(controllerId)) {
                    if (!playerPersistentStats.has(playerName)) {
                      playerPersistentStats.set(playerName, {
                        playerName: playerName,
                        conversions: 0,
                        deathsByConversion: 0,
                        gamesWon: 0,
                      });
                    }

                    // Determine team with the fewest players
                    const teamCounts = new Array(TEAM_INFO.length).fill(0);
                    for (const p of players.values()) {
                      if (p.team >= 0 && p.team < teamCounts.length) {
                        teamCounts[p.team]++;
                      }
                    }

                    let targetTeamIdx = 0;
                    if (TEAM_INFO.length > 0) {
                      let minPlayers = teamCounts[0];
                      for (let i = 1; i < teamCounts.length; i++) {
                        if (teamCounts[i] < minPlayers) {
                          minPlayers = teamCounts[i];
                          targetTeamIdx = i;
                        }
                      }
                    }
                    // If all teams have equal players, it will default to the first team (index 0)
                    // or the first one encountered with the minimum count.

                    const teamIdx = targetTeamIdx; // Assign to team with fewest players
                    // const teamIdx = nextTeam; // OLD LOGIC
                    // nextTeam = (nextTeam + 1) % TEAM_INFO.length; // OLD LOGIC - nextTeam is not incremented here anymore for this path

                    const { ratioX, ratioY } = randomFloorPosition(); // Get random position
                    players.set(
                      controllerId,
                      initializePlayer(
                        // Calling imported function
                        controllerId,
                        playerName,
                        teamIdx,
                        ratioX,
                        ratioY
                      )
                    );
                    // console.log(
                    //   `[SERVER LOG] Player ${playerName} (ID: ${controllerId}) connected at random floor position.`
                    // );
                    // console.log(
                    //   '[SERVER LOG] Players map after new player:',
                    //   JSON.stringify(Array.from(players.entries()))
                    // );
                  }

                  // Reset game over state if a new/reconnecting player joins an empty/gameOver game
                  if (players.size === 1 && gameOver) {
                    gameOver = false;
                    winningTeam = null;
                    teamScores[0] = 0;
                    teamScores[1] = 0;
                  }
                  break;

                case 'restart_game':
                  // console.log('[SERVER LOG] RESTART_GAME message received.');
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
                    players.set(
                      p_orig.id,
                      initializePlayer(
                        p_orig.id,
                        p_orig.playerName,
                        teamIdx,
                        0,
                        0
                      )
                    );
                  });
                  // console.log(
                  //   'Game state reset complete, players reassigned to teams'
                  // );

                  // Broadcast updated game state to all clients
                  const updatedGameState = {
                    players: Array.from(players.values()),
                    balloons,
                    teamScores,
                    friendlyFireEnabled,
                    gameOver,
                    winningTeam,
                    teamSessionWins,
                    teamNames: TEAM_INFO.map((t) => t.name),
                  };

                  // console.log(
                  //   'Broadcasting game state after restart_game:',
                  //   JSON.stringify(updatedGameState)
                  // );
                  wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(
                        JSON.stringify({
                          type: 'state',
                          state: updatedGameState,
                        })
                      );
                    }
                  });
                  break;

                case 'input':
                  // console.log(`[SERVER LOG] INPUT message for clientId: ${msg.clientId}`); // Optional: too verbose if frequent
                  if (players.has(msg.clientId)) {
                    const p = players.get(msg.clientId)!;
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
                      if (
                        Math.abs(p.aimX) < DEAD_ZONE &&
                        Math.abs(p.aimY) < DEAD_ZONE
                      ) {
                        p.umbrellaAngle = UMBRELLA_DEFAULT_ANGLE; // Default upwards
                      } else {
                        p.umbrellaAngle = Math.atan2(p.aimY, p.aimX);
                      }
                    } else {
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
                    if (
                      rightTriggerPressed &&
                      !p.prevTrigger &&
                      !p.isUmbrellaOpen
                    ) {
                      p.triggerStart = Date.now();
                    }

                    // throw balloon on trigger release, only if umbrella is NOT open
                    if (
                      !rightTriggerPressed &&
                      p.prevTrigger &&
                      p.triggerStart &&
                      !p.isUmbrellaOpen
                    ) {
                      // compute charge power
                      const now = Date.now();
                      const start = p.triggerStart ?? now;
                      const hold = Math.min(now - start, MAX_CHARGE_TIME);
                      const throwPower = hold / MAX_CHARGE_TIME; // This is [0, 1]
                      // reset charge timer
                      p.triggerStart = null; // Reset triggerStart

                      const aimMagnitude = Math.sqrt(
                        p.aimX * p.aimX + p.aimY * p.aimY
                      );

                      // only throw if aiming
                      if (aimMagnitude > DEAD_ZONE) {
                        // // Normalize aim vector for consistent spawn offset distance -- REMOVED for matching client aim circle
                        // const normAimX = p.aimX / aimMagnitude;
                        // const normAimY = p.aimY / aimMagnitude;

                        // Calculate spawn offset using raw aim vector and AIM_OFFSET_PX_CONST
                        // This matches the client's aim circle rendering logic.
                        const spawnOffsetX_ratio =
                          p.aimX * (AIM_OFFSET_PX_CONST / HALF_W);
                        const spawnOffsetY_ratio =
                          p.aimY * (AIM_OFFSET_PX_CONST / HALF_H);

                        const spawnX = p.ratioX + spawnOffsetX_ratio;
                        const spawnY = p.ratioY + spawnOffsetY_ratio;

                        // Adjust speed: min is 0.5 * THROW_SPEED, max is 1.0 * THROW_SPEED
                        // throwPower (charge time) determines the base speed multiplier.
                        const effectivePower = (0.5 + throwPower * 0.5) * 1.4; // Scale by 1.4
                        const baseSpeed = THROW_SPEED * effectivePower;

                        // Balloon velocity uses the original p.aimX, p.aimY, scaled by baseSpeed.
                        // This means pushing the stick further still results in a faster balloon,
                        // independent of the now-constant spawn offset distance.
                        balloons.push({
                          id: `${msg.clientId}-${now}`,
                          x: spawnX,
                          y: spawnY,
                          vx: p.vx + p.aimX * baseSpeed, // Re-add player's vx
                          vy: p.vy + p.aimY * baseSpeed, // Re-add player's vy
                          radius: BALLOON_RADIUS_RATIO,
                          ownerId: msg.clientId,
                          team: p.team,
                          teamColor: p.wetnessColor,
                          power: throwPower, // Store the charge power for potential future use (e.g., visual effects)
                        });
                      }
                    }
                    p.prevTrigger = rightTriggerPressed; // Update prevTrigger state
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

      ws.on('close', (code: number, reason: Buffer) => {
        const reasonString = reason.toString();
        const primaryId = socketClientId.get(ws); // Get ID before it's deleted from map
        const controllerIdsSet = clientAssociatedControllerIds.get(ws); // Get controller IDs before deletion

        console.log(
          `[SERVER LOG] Close handler: Connection closed. Code: ${code}, Reason: "${reasonString}". Primary ID: ${
            primaryId || 'N/A'
          }. Associated controller IDs: ${
            controllerIdsSet ? Array.from(controllerIdsSet).join(', ') : 'N/A'
          }`
        );

        if (controllerIdsSet) {
          controllerIdsSet.forEach((controllerId) => {
            const playerWhoLeft = players.get(controllerId);
            if (playerWhoLeft) {
              console.log(
                `[SERVER LOG] Player ${playerWhoLeft.playerName} (ID: ${controllerId}) disconnecting. Code: ${code}, Reason: "${reasonString}". Saving state.`
              );
              disconnectedPlayerStates.set(controllerId, {
                team: playerWhoLeft.team,
                ratioX: playerWhoLeft.ratioX,
                ratioY: playerWhoLeft.ratioY,
                // Potentially save score, etc., if desired for rejoin
              });
              players.delete(controllerId);
              console.log(
                `[SERVER LOG] Player ${playerWhoLeft.playerName} (ID: ${controllerId}) disconnected. State saved. Remaining players: ${players.size}`
              );
            } else {
              console.log(
                `[SERVER LOG] Close handler: No player found for controllerId ${controllerId} during cleanup. Code: ${code}, Reason: "${reasonString}".`
              );
            }
          });
        } else {
          console.log(
            `[SERVER LOG] Close handler: Connection closed, but no controller IDs were associated with this WebSocket. Code: ${code}, Reason: "${reasonString}". Primary ID (if any was set): ${
              primaryId || 'N/A'
            }`
          );
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

  // console.log('Setting up main game loop (setInterval)...'); // Existing log
  const gameLoopInterval = setInterval(() => {
    // console.log('Main game loop tick.'); // Added log

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
      if (b.x < -1 || b.x > 1 || b.y < -1 || b.y > 1) balloons.splice(i, 1);
    }

    // Balloon-balloon collision (simple merge for now)
    const toMerge: GameObject[] = [];
    const toRemoveIndices: number[] = [];
    for (let i = 0; i < balloons.length; i++) {
      if (toRemoveIndices.includes(i)) continue;
      for (let j = i + 1; j < balloons.length; j++) {
        if (toRemoveIndices.includes(j)) continue;
        const b1 = balloons[i];
        const b2 = balloons[j];
        const dx = b1.x - b2.x;
        const dy = b1.y - b2.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < (b1.radius + b2.radius) ** 2) {
          toRemoveIndices.push(i); // Mark b1 for removal
          toRemoveIndices.push(j); // Mark b2 for removal
          break; // b1 is merged, move to next balloon
        }
      }
    }
    toRemoveIndices
      .sort((a, b) => b - a)
      .forEach((idx) => balloons.splice(idx, 1));
    balloons.push(...toMerge);

    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      for (const p of players.values()) {
        if (p.isUmbrellaOpen) {
          const aimMagnitude = Math.sqrt(p.aimX * p.aimX + p.aimY * p.aimY);
          let currentReachMultiplier = 1.0;
          if (aimMagnitude > DEAD_ZONE) {
            const normalizedAimMagnitude = Math.min(aimMagnitude, 1.0);
            currentReachMultiplier =
              1 + (UMBRELLA_MAX_REACH_MULTIPLIER - 1) * normalizedAimMagnitude;
          }
          const dynamicUmbrellaDistanceRatio =
            BASE_UMBRELLA_DISTANCE_RATIO * currentReachMultiplier;
          const umbrellaEffectiveCenterX =
            p.ratioX + Math.cos(p.umbrellaAngle) * dynamicUmbrellaDistanceRatio;
          const umbrellaEffectiveCenterY =
            p.ratioY + Math.sin(p.umbrellaAngle) * dynamicUmbrellaDistanceRatio;
          const cosA = Math.cos(-p.umbrellaAngle);
          const sinA = Math.sin(-p.umbrellaAngle);
          const translatedBalloonX = b.x - umbrellaEffectiveCenterX;
          const translatedBalloonY = b.y - umbrellaEffectiveCenterY;
          const rotatedBalloonX =
            translatedBalloonX * cosA - translatedBalloonY * sinA;
          const rotatedBalloonY =
            translatedBalloonX * sinA + translatedBalloonY * cosA;
          if (
            Math.abs(rotatedBalloonX) < UMBRELLA_WIDTH_RATIO / 2 + b.radius &&
            Math.abs(rotatedBalloonY) < UMBRELLA_HEIGHT_RATIO / 2 + b.radius
          ) {
            balloons.splice(i, 1);
            break;
          }
        }
        if (p.team === b.team && !friendlyFireEnabled) {
          continue;
        }
        const dx = p.ratioX - b.x;
        const dy = p.ratioY - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < (COLLISION_RADIUS + b.radius) ** 2) {
          p.wetnessLevel += WETNESS_PER_HIT * (b.power + 0.5);
          p.wetnessLevel = Math.min(p.wetnessLevel, MAX_WETNESS);
          if (p.wetnessLevel >= MAX_WETNESS) {
            const oldTeam = p.team;
            p.team = (p.team + 1) % TEAM_INFO.length;
            p.wetnessColor = TEAM_INFO[p.team].hex;
            p.wetnessLevel = 0;
            const throwerPlayer = players.get(b.ownerId);
            const throwerStats = throwerPlayer
              ? playerPersistentStats.get(throwerPlayer.playerName)
              : undefined;
            if (throwerStats) {
              throwerStats.conversions++;
            }
            const hitPlayerStats = playerPersistentStats.get(p.playerName);
            if (hitPlayerStats) {
              hitPlayerStats.deathsByConversion++;
            }
            if (oldTeam !== b.team) {
              teamScores[b.team]++;
            } else if (friendlyFireEnabled && oldTeam === b.team) {
              teamScores[b.team]++;
            }
            const WINNING_SCORE = 5;
            if (teamScores[b.team] >= WINNING_SCORE) {
              gameOver = true;
              winningTeam = b.team;
              teamSessionWins[b.team]++;
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
          balloons.splice(i, 1);
          break;
        }
      }
    }

    for (const p of players.values()) {
      const prevX = p.ratioX;
      const prevY = p.ratioY;

      // TEMP: Log player state before physics update for a specific player if needed
      // if (p.playerName === 'YourPlayerName') { // Replace 'YourPlayerName' with a name for focused logging
      //   console.log(`[PRE-PHYSICS] ${p.playerName}: X=${p.ratioX.toFixed(3)}, Y=${p.ratioY.toFixed(3)}, VX=${p.vx.toFixed(3)}, VY=${p.vy.toFixed(3)}, Grounded=${p.isGrounded}`);
      // }

      // Apply gravity
      let currentGravity = GRAVITY;
      let currentTerminalVelocity = TERMINAL_VELOCITY_CONST;
      let currentMoveSpeedMultiplier = 1.0;
      if (p.isUmbrellaOpen) {
        currentMoveSpeedMultiplier = UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER;
        if (p.vy > 0) {
          currentGravity *= UMBRELLA_GRAVITY_MULTIPLIER;
          currentTerminalVelocity = UMBRELLA_TERMINAL_VELOCITY;
        }
      }
      p.vx *= currentMoveSpeedMultiplier;

      p.vy += currentGravity * dt;
      p.vy = Math.min(p.vy, currentTerminalVelocity); // Apply terminal velocity

      // Update horizontal position
      p.ratioX += p.vx * dt;

      // Update vertical position
      p.ratioY += p.vy * dt;

      // TEMP: Log after position update, before collision correction
      // if (p.playerName === 'YourPlayerName') { // Replace 'YourPlayerName'
      //   console.log(`[POST-MOVE] ${p.playerName}: X=${p.ratioX.toFixed(3)}, Y=${p.ratioY.toFixed(3)}, VX=${p.vx.toFixed(3)}, VY=${p.vy.toFixed(3)}`);
      // }

      // Boundary collision (replaces tile collision for now)
      let collidedX = false;
      let collidedY = false;

      if (p.ratioX - PLAYER_RADIUS_RATIO_X < -1) {
        p.ratioX = -1 + PLAYER_RADIUS_RATIO_X;
        p.vx = 0;
        collidedX = true;
      } else if (p.ratioX + PLAYER_RADIUS_RATIO_X > 1) {
        p.ratioX = 1 - PLAYER_RADIUS_RATIO_X;
        p.vx = 0;
        collidedX = true;
      }

      if (p.ratioY - PLAYER_RADIUS_RATIO_Y < -1) {
        // Top boundary
        p.ratioY = -1 + PLAYER_RADIUS_RATIO_Y;
        p.vy = 0;
        collidedY = true;
      } else if (p.ratioY + PLAYER_RADIUS_RATIO_Y > 1) {
        // Bottom boundary (ground)
        p.ratioY = 1 - PLAYER_RADIUS_RATIO_Y;
        p.vy = 0;
        p.isGrounded = true;
        p.jumpsRemaining = MAX_JUMPS_CONST;
        collidedY = true;
      } else {
        if (p.ratioY + PLAYER_RADIUS_RATIO_Y < 1) {
          // Check if airborne
          p.isGrounded = false;
        }
      }

      // TEMP: Log after collision correction if a collision occurred
      // if (p.playerName === 'YourPlayerName' && (collidedX || collidedY)) { // Replace 'YourPlayerName'
      //   console.log(`[POST-COLLISION] ${p.playerName}: X=${p.ratioX.toFixed(3)}, Y=${p.ratioY.toFixed(3)}, VX=${p.vx.toFixed(3)}, VY=${p.vy.toFixed(3)}, CollidedX=${collidedX}, CollidedY=${collidedY}`);
      // }

      // Player drying logic
      if (p.wetnessLevel > 0) {
        p.wetnessLevel -= PLAYER_DRYING_RATE_CONST * dt;
        p.wetnessLevel = Math.max(0, p.wetnessLevel);
      }
    }

    if (!gameOver && players.size > 1) {
      const firstPlayer = players.values().next().value;
      if (firstPlayer) {
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
          winningTeam = firstPlayerTeam;
          teamSessionWins[firstPlayerTeam]++;
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

    const persistentPlayerStatsArray = Array.from(
      playerPersistentStats.values()
    );

    // Construct the game state object
    const gameState: types.GameState = {
      players: Array.from(players.values()),
      balloons, // Corrected: removed extra newline
      teamScores,
      friendlyFireEnabled,
      gameOver,
      winningTeam,
      persistentPlayerStats: Array.from(playerPersistentStats.values()),
      teamSessionWins,
      teamNames: TEAM_INFO.map((t) => t.name),
      tilemap: null, // Send null for tilemap
    };

    // console.log(\'Broadcasting game state:\', JSON.stringify(gameState));
    // Broadcast game state to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'state', state: gameState }));
      }
    });
  }, 16); // Approximately 60 FPS

  return { server, wss, gameLoopInterval };
}

// Get port from environment variable or default to 8080
const port = parseInt(process.env.PORT || '8080', 10);

// Create and start the server
const { server, gameLoopInterval } = createServer(port);
server.listen(port, () => {
  // console.log(`[SERVER LOG] Server listening on port ${port}`);
});

// Handle process termination to clean up the interval
process.on('SIGINT', () => {
  // console.log('[SERVER LOG] SIGINT received, shutting down...');
  clearInterval(gameLoopInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  // console.log('[SERVER LOG] SIGTERM received, shutting down...');
  clearInterval(gameLoopInterval);
  process.exit(0);
});