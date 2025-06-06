"use strict";
// Simple WebSocket client for Fiveteen game with unique client fingerprint
// Generate a unique client ID
const clientId = `${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
console.log('Client ID:', clientId);
// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Connect to server
const serverUrl = `ws://${window.location.hostname}:8080`;
const socket = new WebSocket(serverUrl);
// On connection, send init
socket.addEventListener('open', () => {
    console.log('Connected to server');
    socket.send(JSON.stringify({ type: 'init', clientId }));
});
// Handle incoming game state
socket.addEventListener('message', (event) => {
    try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state') {
            renderGameState(msg.state.players);
        }
    }
    catch { }
});
// Poll gamepad input
let prevAxes = [];
let prevButtons = [];
window.addEventListener('gamepadconnected', () => {
    console.log('Gamepad connected');
    pollGamepad();
});
window.addEventListener('gamepaddisconnected', () => {
    console.log('Gamepad disconnected');
    prevAxes = [];
    prevButtons = [];
});
// Begin polling immediately (captures already-connected gamepads)
pollGamepad();
function pollGamepad() {
    const gp = navigator.getGamepads()[0];
    if (gp) {
        const axes = gp.axes.slice();
        const buttons = gp.buttons.map((b) => b.pressed);
        console.log('Sending input:', axes.map(a => a.toFixed(2)), buttons);
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'input', clientId, axes, buttons }));
        }
    }
    requestAnimationFrame(pollGamepad);
}
// Render players using server‐driven positions
function renderGameState(players) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    players.forEach((p) => {
        ctx.fillStyle = '#000';
        // draw relative to screen center
        const x = canvas.width / 2 + p.x;
        const y = canvas.height / 2 + p.y;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();
    });
}
