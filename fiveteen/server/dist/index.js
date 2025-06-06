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
function createServer(port) {
    const server = http_1.default.createServer();
    const wss = new ws_1.WebSocketServer({ server });
    const players = new Map();
    const socketClientId = new Map();
    wss.on('connection', (ws) => {
        let clientId;
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                switch (msg.type) {
                    case 'init':
                        clientId = msg.clientId;
                        // start at origin (will be offset client-side)
                        players.set(clientId, { id: clientId, x: 0, y: 0, axes: [], buttons: [] });
                        socketClientId.set(ws, clientId);
                        console.log(`Player connected: ${clientId}`);
                        break;
                    case 'input':
                        console.log(`Received input from ${msg.clientId}`);
                        console.log({ msg });
                        if (players.has(msg.clientId)) {
                            const p = players.get(msg.clientId);
                            console.log(`Input from ${msg.clientId}: axes=${msg.axes.map(a => a.toFixed(2))}`);
                            p.axes = msg.axes;
                            p.buttons = msg.buttons;
                            // move based on left stick
                            const speed = 5;
                            p.x += msg.axes[0] * speed;
                            p.y += msg.axes[1] * speed;
                            console.log(`Player ${msg.clientId} new pos: x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}`);
                        }
                        break;
                    case 'ping':
                        // ignore or echo back
                        break;
                }
            }
            catch (err) {
                console.warn('Malformed message', err);
            }
        });
        ws.on('close', () => {
            const id = socketClientId.get(ws);
            if (id) {
                players.delete(id);
                socketClientId.delete(ws);
                console.log(`Player disconnected: ${id}`);
            }
        });
    });
    // Broadcast game state 30×/sec
    setInterval(() => {
        const state = { players: Array.from(players.values()) };
        const payload = JSON.stringify({ type: 'state', state });
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(payload);
            }
        });
    }, 1000 / 30);
    server.listen(port, () => {
        console.log(`WebSocket server listening on port ${port}`);
    });
    return { server, wss };
}
// If run directly
if (require.main === module) {
    createServer(8080);
}
