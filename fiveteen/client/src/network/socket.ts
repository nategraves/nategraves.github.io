/**
 * Holds the shared WebSocket instance for the client.
 */
export let socket: WebSocket;
export let reconnectAttempts = 0;
export let isGameOverInternal = false;
