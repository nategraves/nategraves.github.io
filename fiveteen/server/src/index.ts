import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

// Level bounds constants
const LEVEL_WIDTH = 1000;
const LEVEL_HEIGHT = 600;
const HALF_W = LEVEL_WIDTH / 2;
const HALF_H = LEVEL_HEIGHT / 2;

// Player drawing constants (server uses normalized ratios)
const PLAYER_RADIUS = 20; // px
// Level bounds half-dimensions
const MAX_RATIO_X = 1 - PLAYER_RADIUS / HALF_W;
const MAX_RATIO_Y = 1 - PLAYER_RADIUS / HALF_H;

// Physics constants
const GRAVITY = 10;           // ratio units per second² downward
const JUMP_VELOCITY = -1.5;  // ratio units per second upward
const THROW_SPEED = 2;       // ratio units per second for balloon velocity
const DEAD_ZONE = 0.1;       // minimal aim threshold
// Tunable move and jump settings
const MOVE_SPEED = 50;         // horizontal speed in ratio units per second (increase for faster movement)
const JUMP_MULTIPLIER = 5;     // multiplier for jump velocity

// Collision detection radius in ratio units (approximate)
const COLLISION_RADIUS = PLAYER_RADIUS / HALF_W;
// initial balloon radius matches collision radius
const BALLOON_RADIUS_RATIO = COLLISION_RADIUS;

export interface Player {
  id: string;
  ratioX: number;             // normalized X in [-1,1]
  ratioY: number;             // normalized Y in [-1,1]
  vx: number;                 // horizontal velocity (ratio/sec)
  buttons: boolean[];
  vy: number;                 // vertical velocity (ratio/sec)
  prevJump: boolean;         // track jump button last frame
  prevTrigger: boolean;      // track trigger button last frame
  aimX: number;               // normalized aim vector X [-1,1]
  aimY: number;               // normalized aim vector Y [-1,1]
  score: number;              // player's score
}

export interface GameObject {
  id: string;
  x: number;                 // ratioX
  y: number;                 // ratioY
  vx: number;
  vy: number;
  radius: number;            // collision/visual size in ratio units
}

export interface GameState {
  players: Player[];
  balloons: GameObject[];
}

type MsgInit = { type: 'init'; clientId: string };
type MsgInput = { type: 'input'; clientId: string; axes: number[]; buttons: boolean[] };
type MsgPing = { type: 'ping' };
type MsgLevel = { type: 'level'; levelId: string };
type MsgDisconnect = { type: 'disconnect'; clientId: string };
type IncomingMessage = MsgInit | MsgInput | MsgPing | MsgLevel;
// support explicit disconnect messages
type IncomingMessageAll = IncomingMessage | MsgDisconnect;

export function createServer(port: number): { server: http.Server; wss: WebSocketServer } {
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  const players = new Map<string, Player>();
  const socketClientId = new Map<WebSocket, string>();
  const balloons: GameObject[] = [];

  wss.on('connection', (ws: WebSocket) => {
    let clientId: string | undefined;

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString()) as IncomingMessageAll;
        switch (msg.type) {
          case 'init':
            clientId = msg.clientId;
            // start at centered ratio, no aim
            players.set(clientId, {
              id: clientId,
              ratioX: 0,
              ratioY: 0,
              vx: 0,
              buttons: Array(8).fill(false), // default buttons
              vy: 0,
              prevJump: false,
              prevTrigger: false,
              aimX: 0,
              aimY: 0,
              score: 0
            });
            socketClientId.set(ws, clientId);
            break;

          case 'input':
            if (players.has(msg.clientId)) {
              const p = players.get(msg.clientId)!;
              p.buttons = msg.buttons;
              // set horizontal velocity based on left joystick X
              const horizSpeed = MOVE_SPEED / HALF_W; // ratio units per second
              p.vx = msg.axes[0] * horizSpeed;
               // aim vector
               p.aimX = msg.axes[2] ?? 0;
               p.aimY = msg.axes[3] ?? 0;
               // jump on button[1]
               if (msg.buttons[1] && !p.prevJump) {
                 // amplified jump
                 p.vy = JUMP_VELOCITY * JUMP_MULTIPLIER;
               }
               p.prevJump = msg.buttons[1];
               // throw balloon on right trigger release (button[7])
              if (!msg.buttons[7] && p.prevTrigger && (Math.abs(p.aimX) > DEAD_ZONE || Math.abs(p.aimY) > DEAD_ZONE)) {
                balloons.push({
                  id: `${msg.clientId}-${Date.now()}`,
                  x: p.ratioX,
                  y: p.ratioY,
                  vx: p.aimX * THROW_SPEED,  // throw in ratio units/sec
                  vy: p.aimY * THROW_SPEED,
                  radius: BALLOON_RADIUS_RATIO
                });
              }
               p.prevTrigger = msg.buttons[7];
             }
             break;

          case 'disconnect':
            // remove disconnected player
            players.delete((msg as MsgDisconnect).clientId);
            break;

          case 'ping':
            // ignore
            break;
          case 'level':
            // broadcast level change to all clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'level', levelId: msg.levelId }));
              }
            });
          break;
         }
      } catch (err) {
        console.warn('Malformed message', err);
        // echo back non-JSON messages
        ws.send(`Server echo: ${data.toString()}`);
        return;
      }
    });

    ws.on('close', () => {
      const id = socketClientId.get(ws);
      if (id) {
        players.delete(id);
        socketClientId.delete(ws);
      }
    });
  });

  // Game loop: physics + broadcast
  const loop = setInterval(() => {
     const dt = 1 / 30;
     // update player gravity and position
     players.forEach(p => {
       // update horizontal position from velocity
       const newX = p.ratioX + p.vx * dt;
       p.ratioX = Math.max(-MAX_RATIO_X, Math.min(MAX_RATIO_X, newX));
       // apply gravity directly (ratio units per second²)
      p.vy += GRAVITY * dt;
      const newY = p.ratioY + p.vy * dt;
      // clamp vertical and allow falling back
      if (newY > MAX_RATIO_Y) {
        p.ratioY = MAX_RATIO_Y;
        p.vy = 0;
      } else if (newY < -MAX_RATIO_Y) {
        p.ratioY = -MAX_RATIO_Y;
        p.vy = 0;
      } else {
        p.ratioY = newY;
      }
     });
     // update balloons
     for (let i = balloons.length - 1; i >= 0; i--) {
       const b = balloons[i];
       // apply gravity directly
       b.vy += GRAVITY * dt;
       b.x += b.vx * dt;
       b.y += b.vy * dt;
       // remove if out of bounds
       if (b.x < -1 || b.x > 1 || b.y < -1 || b.y > 1) balloons.splice(i, 1);
     }
     // merge balloons on collision
     const toMerge: GameObject[] = [];
     const removeIdx = new Set<number>();
     for (let i = 0; i < balloons.length; i++) {
       for (let j = i + 1; j < balloons.length; j++) {
         if (removeIdx.has(i) || removeIdx.has(j)) continue;
         const b1 = balloons[i];
         const b2 = balloons[j];
         const dx = b1.x - b2.x;
         const dy = b1.y - b2.y;
         const dist = Math.hypot(dx, dy);
         if (dist <= b1.radius + b2.radius) {
           // merge into new balloon
           toMerge.push({
             id: `${b1.id}|${b2.id}-${Date.now()}`,
             x: (b1.x + b2.x) / 2,
             y: (b1.y + b2.y) / 2,
             vx: (b1.vx + b2.vx) / 2,
             vy: (b1.vy + b2.vy) / 2,
             radius: b1.radius + b2.radius
           });
           removeIdx.add(i);
           removeIdx.add(j);
         }
       }
     }
     // remove merged balloons
     Array.from(removeIdx).sort((a,b) => b - a).forEach(idx => balloons.splice(idx, 1));
     // add merged balloons
     balloons.push(...toMerge);

     // collision detection: balloons hitting players
     for (let i = balloons.length - 1; i >= 0; i--) {
       const b = balloons[i];
       for (const p of players.values()) {
         const dx = b.x - p.ratioX;
         const dy = b.y - p.ratioY;
         if (dx * dx + dy * dy <= COLLISION_RADIUS * COLLISION_RADIUS) {
           // collision: increment score and remove balloon
           p.score++;
           balloons.splice(i, 1);
           break;
         }
       }
     }
     // skip broadcasting when no players or balloons
     if (players.size === 0 && balloons.length === 0) return;
     // broadcast
     const state = { players: Array.from(players.values()), balloons };
     const payload = JSON.stringify({ type: 'state', state });
     wss.clients.forEach(client => {
       if (client.readyState === WebSocket.OPEN) client.send(payload);
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