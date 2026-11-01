import type { GameState } from "./types";
import { renderGameState } from "./rendering";
import { updateStatus, updateLevelInUI, manageRestartButton } from "./ui"; // Added manageRestartButton

let socket: WebSocket;
let reconnectAttempts = 0;
const controllerPlayerNames = new Map<string, string>();
let isGameOverInternal = false; // Internal state for network module

export function getSocket(): WebSocket {
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    connectWebSocket(); // Attempt to connect if socket is not usable
  }
  return socket;
}

export function getPlayerName(controllerId: string): string {
  if (controllerPlayerNames.has(controllerId)) {
    return controllerPlayerNames.get(controllerId)!;
  }

  let name = localStorage.getItem(`fiveteenPlayerName_${controllerId}`);
  if (!name) {
    const promptIndex = controllerId.includes("-")
      ? controllerId.split("-").pop()
      : controllerId;
    name = prompt(
      `Enter player name for controller ${promptIndex} (max 8 characters):`
    );
    if (name && name.length > 8) {
      name = name.substring(0, 8);
    }
    if (!name) {
      name = `Player${Math.floor(Math.random() * 1000)}`;
    }
    localStorage.setItem(`fiveteenPlayerName_${controllerId}`, name);
  }
  controllerPlayerNames.set(controllerId, name);
  return name;
}

export function connectWebSocket() {
  try {
    const wsUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? `ws://${window.location.hostname}:3001` // Local development
        : "ws://172.237.130.113:3001"; // Deployed environment (no TLS)

    socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
      updateStatus("Connected");
      reconnectAttempts = 0;
      for (const [ctrlId, playerName] of controllerPlayerNames.entries()) {
        if (socket.readyState === WebSocket.OPEN) {
          console.log(`Re-sending init for ${ctrlId} after ws reconnection.`);
          sendWebSocketMessage({
            type: "init",
            clientId: ctrlId,
            playerName: playerName,
          });
        }
      }
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      // Added type for event
      if (typeof event.data === "string") {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "state") {
          console.log(
            `[CLIENT] Received state update with ${msg.state.players.length} players`
          );
          renderGameState(msg.state as GameState);
          isGameOverInternal = msg.state.gameOver;
          manageRestartButton(isGameOverInternal); // Manage restart button based on game over state
        } else if (msg.type === "level") {
          console.log("Level update received:", msg.levelId);
          updateLevelInUI(msg.levelId);
        } else if (msg.type === "error") {
          console.error("Server error:", msg.message);
          updateStatus(`Error: ${msg.message}`);
        }
      } else if (event.data instanceof Blob) {
        // console.log("Received audio blob");
        // handleAudioBlob(event.data);
      }
    });

    socket.addEventListener("close", () => {
      updateStatus("Disconnected. Attempting to reconnect...");
      isGameOverInternal = true; // Assume game is over or unplayable if disconnected
      manageRestartButton(isGameOverInternal);
      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        console.log(
          `Attempting to reconnect... (Attempt ${reconnectAttempts})`
        );
        setTimeout(connectWebSocket, 5000);
      } else {
        console.error("Max reconnection attempts reached.");
        updateStatus("Disconnected. Max reconnect attempts reached.");
      }
    });

    socket.addEventListener("error", (event: Event) => {
      // Added type for event
      console.error("WebSocket error observed:", event);
      updateStatus("Connection Error");
      isGameOverInternal = true; // Assume game is over or unplayable on error
      manageRestartButton(isGameOverInternal);
    });
  } catch (error) {
    console.error("connectWebSocket: CRITICAL ERROR:", error);
    updateStatus("Failed to connect");
    isGameOverInternal = true;
    manageRestartButton(isGameOverInternal);
  }
}

export function sendWebSocketMessage(message: object) {
  // getSocket ensures the socket is valid or tries to reconnect.
  const currentSocket = getSocket(); 
  if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
    currentSocket.send(JSON.stringify(message));
  } else {
    console.warn("WebSocket not open. Message not sent:", message);
    updateStatus("Connection issue. Please wait...");
  }
}

export function getIsGameOver(): boolean {
    return isGameOverInternal;
}
