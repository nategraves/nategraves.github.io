import type { GameState } from "../types";

export const state: {
  socket: WebSocket | null;
  reconnectAttempts: number;
  isGameOverInternal: boolean;
} = {
  socket: null,
  reconnectAttempts: 0,
  isGameOverInternal: false,
};