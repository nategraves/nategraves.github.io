import WebSocket from 'ws';

export function echoFallback(ws: WebSocket, data: WebSocket.Data): void {
  let messageString: string | null = null;
  if (typeof data === 'string') {
    messageString = data;
  } else if (
    data instanceof Buffer ||
    data instanceof ArrayBuffer ||
    (Array.isArray(data) && data.every((item) => Buffer.isBuffer(item)))
  ) {
    try {
      messageString = Buffer.from(data as any).toString('utf8');
    } catch (e) {}
  }

  if (messageString !== null) {
    ws.send(`Server echo: ${messageString}`);
  }
}
