"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const ws_1 = __importDefault(require("ws"));
let instance;
beforeAll(() => {
    // Start server on an ephemeral port
    instance = (0, index_1.createServer)(0);
});
afterAll((done) => {
    // Close WebSocket server and HTTP server
    instance.wss.close();
    instance.server.close(done);
});
test('createServer returns server and wss instances', () => {
    expect(instance.server).toBeDefined();
    expect(instance.wss).toBeDefined();
});
test('server echoes messages back to client', (done) => {
    // Get the actual port assigned
    // @ts-ignore
    const port = instance.server.address().port;
    const ws = new ws_1.default(`ws://localhost:${port}`);
    ws.on('open', () => {
        ws.send('hello');
    });
    ws.on('message', (data) => {
        expect(data.toString()).toBe('Server echo: hello');
        ws.close();
        done();
    });
    ws.on('error', (err) => {
        done(err);
    });
});
