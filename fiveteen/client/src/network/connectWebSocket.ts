import { state } from "./state";
import { updateStatus, manageRestartButton } from "../ui";

export function connectWebSocket() {
  try {
    const wsUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? `ws://${window.location.hostname}:3001` // Local dev
        : `ws://172.237.130.113:3001`;
    state.socket = new WebSocket(wsUrl);
    state.socket.addEventListener("open", () => {
      updateStatus("Connected");
      state.reconnectAttempts = 0;
      // ... existing init resend logic here ...
    });
    state.socket.addEventListener("close", () => {
      updateStatus("Disconnected. Attempting to reconnect...");
      state.isGameOverInternal = true;
      manageRestartButton(state.isGameOverInternal);
      if (state.reconnectAttempts < 5) {
        state.reconnectAttempts++;
        setTimeout(connectWebSocket, 5000);
      }
    });
    state.socket.addEventListener("error", (event) => {
      updateStatus("Connection Error");
      state.isGameOverInternal = true;
      manageRestartButton(state.isGameOverInternal);
    });
  } catch (error) {
    updateStatus("Failed to connect");
    state.isGameOverInternal = true;
    manageRestartButton(state.isGameOverInternal);
  }
}
