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
function connect() {
  socket = new WebSocket(`ws://${window.location.hostname}:8080`);
  socket.addEventListener('open', () => {
      reconnectAttempts = 0;
      statusSpan.textContent = 'Connected';
      // send init for any controllers already detected
      Object.values(controllerIds).forEach(ctrlId => {
        socket.send(JSON.stringify({ type: 'init', clientId: ctrlId }));
      });
    });
  socket.addEventListener('message', event => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state') {
        renderGameState(msg.state.players, msg.state.balloons);
      } else if (msg.type === 'level') {
        currentLevel = msg.levelId;
        levelSelect.value = currentLevel;
      }
    } catch {}
  });
  socket.addEventListener('close', () => {
    statusSpan.textContent = 'Disconnected';
    const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts);
    reconnectAttempts++;
    setTimeout(connect, delay);
  });
  socket.addEventListener('error', err => {
    statusSpan.textContent = 'Error';
  });
}
connect();

// Level select change
levelSelect.addEventListener('change', () => {
  currentLevel = levelSelect.value;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'level', levelId: currentLevel }));
  }
});

// Visual constants
const PLAYER_RADIUS = 20;   // px radius of main circle
const AIM_OFFSET = 38;      // px distance from player center to aim circle center
const AIM_RADIUS = 8;      // px radius of aim circle
const DEAD_ZONE = 0.1;      // joystick dead-zone threshold
const BALLOON_RADIUS = 10;   // px radius of balloon
const SCORE_FONT = '16px sans-serif';

// Player object from server includes x/y
interface PlayerState {
  id: string;
  ratioX: number; // in [-1,1]
  ratioY: number;
  axes: number[];
  buttons: boolean[];
  aimX: number;   // normalized aim vector X
  aimY: number;   // normalized aim vector Y
  score: number;
}

interface BalloonState { id: string; x: number; y: number; }

// Render players using server‐driven positions
function renderGameState(players: PlayerState[], balloons: BalloonState[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw balloons
  // draw balloons in black for visibility
  ctx.fillStyle = '#000';
  balloons.forEach(b => {
    const bx = canvas.width / 2 + b.x * (canvas.width / 2);
    const by = canvas.height / 2 + b.y * (canvas.height / 2);
    ctx.beginPath();
    ctx.arc(bx, by, BALLOON_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  });
  // draw players
  players.forEach((p) => {
    const cx = canvas.width / 2 + p.ratioX * (canvas.width / 2);
    const cy = canvas.height / 2 + p.ratioY * (canvas.height / 2);
    // player main circle
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, PLAYER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    // draw score above player
    ctx.fillStyle = '#fff';
    ctx.font = SCORE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText(p.score.toString(), cx, cy - PLAYER_RADIUS - 5);
    // aim point: calculate and draw reticule in black
    const aimXpx = cx + p.aimX * AIM_OFFSET;
    const aimYpx = cy + p.aimY * AIM_OFFSET;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(aimXpx, aimYpx, AIM_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// Track window focus
let windowActive = document.hasFocus();
window.addEventListener('focus', () => (windowActive = true));
window.addEventListener('blur', () => (windowActive = false));

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
      const ctrlId = `${clientId}-${idx}`;
      controllerIds[idx] = ctrlId;
      // send init immediately if socket is open
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'init', clientId: ctrlId }));
      }
    }
    const ctrlId = controllerIds[idx];
    // apply dead-zone: ignore small stick movement
    const axes = gp.axes.map(a => (Math.abs(a) > DEAD_ZONE ? a : 0));
    const buttons = gp.buttons.map(b => b.pressed);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'input', clientId: ctrlId, axes, buttons }));
    }
  });
  requestAnimationFrame(pollGamepad);
}

// Begin polling immediately (captures already-connected gamepads)
pollGamepad();

// handle controller disconnect to remove player
window.addEventListener('gamepaddisconnected', (e) => {
  const idx = e.gamepad.index;
  const ctrlId = controllerIds[idx];
  if (ctrlId && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'disconnect', clientId: ctrlId }));
  }
  delete controllerIds[idx];
});
// handle controller reconnect to show player again
window.addEventListener('gamepadconnected', (e) => {
  const idx = e.gamepad.index;
  const ctrlId = `${clientId}-${idx}`;
  controllerIds[idx] = ctrlId;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'init', clientId: ctrlId }));
  }
});
