import { createServer } from './index';
import WebSocket from 'ws';

let instance: ReturnType<typeof createServer>;
beforeAll(() => {
  // Start server on an ephemeral port
  instance = createServer(0);
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
  const port = (instance.server.address() as any).port;
  const ws = new WebSocket(`ws://localhost:${port}`);

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
