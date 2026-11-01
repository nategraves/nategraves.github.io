// Input module: Manages gamepad and keyboard input
export {}; // Placeholder to make it a module

import { sendWebSocketMessage, getPlayerName, getSocket } from "./network"; // Added getSocket
import { updateStatus } from "./ui"; // For displaying messages like new controller connection

const previousButtonStates: Record<string, boolean[]> = {};
const previousAxisStates: Record<string, boolean> = {};
const connectedControllerIds = new Set<string>();
let lastInputTime: number = performance.now(); // Added: store the time of the last input processing

export function handleGamepadInput() {
  const gamepads = navigator.getGamepads().filter((gp) => gp !== null) as Gamepad[];
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastInputTime) / 1000; // Calculate deltaTime in seconds
  lastInputTime = currentTime; // Update lastInputTime for the next frame

  gamepads.forEach((gamepad) => {
    const controllerId = gamepad.id + "-" + gamepad.index;

    if (!connectedControllerIds.has(controllerId)) {
      connectedControllerIds.add(controllerId);
      const playerName = getPlayerName(controllerId); // Get or prompt for player name
      console.log(`Gamepad connected: ${controllerId}, Player: ${playerName}`);
      updateStatus(`Controller ${gamepad.index} connected as ${playerName}`);
      // Send init message for new controller
      sendWebSocketMessage({
        type: "init",
        clientId: controllerId,
        playerName: playerName,
      });
      previousButtonStates[controllerId] = gamepad.buttons.map(b => b.pressed);
      previousAxisStates[controllerId] = false; // Initialize axis state
    }

    // Build current button and axis states
    const currentButtonStates = gamepad.buttons.map((b) => b.pressed);
    const currentAxes = gamepad.axes.map((a) => (Math.abs(a) > 0.1 ? a : 0));

    // Always send input each tick to ensure continuous physics updates
    const socket = getSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
        sendWebSocketMessage({
            type: "input",
            clientId: controllerId,
            input: {
                buttons: currentButtonStates,
                axes: currentAxes
            },
            deltaTime: deltaTime // Added: send deltaTime to the server
        });
    }

    // Update previous states for next comparison
    previousButtonStates[controllerId] = currentButtonStates;
    previousAxisStates[controllerId] = currentAxes.some((a) => a !== 0);
  });

  // Check for disconnected gamepads
  const currentlyConnectedIds = new Set(gamepads.map((gp: Gamepad) => gp.id + "-" + gp.index));
  for (const id of connectedControllerIds) {
    if (!currentlyConnectedIds.has(id)) {
      console.log(`Gamepad disconnected: ${id}`);
      updateStatus(`Controller disconnected: ${id.split('-').pop()}`);
      sendWebSocketMessage({ type: "disconnect", clientId: id });
      connectedControllerIds.delete(id);
      delete previousButtonStates[id];
      delete previousAxisStates[id];
      // No need to remove from controllerPlayerNames in network.ts, it can persist for reconnections
    }
  }
}
