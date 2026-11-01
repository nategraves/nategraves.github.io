// filepath: /Volumes/MainExt/dev/web/nategraves.github.io/fiveteen/client/src/main.ts
import type { GameState } from "./types";
import { connectWebSocket, getIsGameOver, sendWebSocketMessage, getSocket } from "./network"; // Added getSocket
import { renderGameState, resizeCanvas, canvas } from "./rendering";
import { setupUI, updateStatus, Level, manageRestartButton } from "./ui"; // Added Level and manageRestartButton
import { handleGamepadInput } from "./input";

// Level definitions
const levels: Level[] = [
  { id: "level1", name: "Level 1" },
  { id: "level2", name: "Level 2" },
];
let currentLevel = levels[0].id;

// Setup UI elements
setupUI(levels, currentLevel, (newLevel: string) => {
  currentLevel = newLevel;
  // Ensure socket is ready before sending. getSocket() handles this.
  sendWebSocketMessage({ type: "level", levelId: currentLevel });
});

// Establish WebSocket connection (it will also be called by getSocket if needed)
connectWebSocket();

// Game loop
function gameLoop() {
  // isGameOver is now managed by network.ts and ui.ts for the restart button
  handleGamepadInput(); // Polls for gamepad input and sends to server
  // renderGameState is primarily called on WebSocket message receipt in network.ts
  requestAnimationFrame(gameLoop);
}

// Initial canvas resize and start game loop
if (canvas) {
  resizeCanvas(); // Initial resize
} else {
  console.error("Canvas not found on initial load.");
  updateStatus("Error: Game canvas not found!");
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Global error handlers
window.addEventListener("error", (event: ErrorEvent) => { // Typed event
  console.error("Unhandled error:", event.error);
  updateStatus("A critical error occurred. Please refresh.");
  // Potentially send error to server
});

window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => { // Typed event
  console.error("Unhandled promise rejection:", event.reason);
  updateStatus("An error occurred with an async operation.");
});
