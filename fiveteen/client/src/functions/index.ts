import { getPlayerName } from '../index.js';

export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, rHex, gHex, bHex) => {
    return "#" + rHex + rHex + gHex + gHex + bHex + bHex;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255, 255, 255, ${alpha})`;
}

export function connectWebSocket(socket: WebSocket, controllerIds: Record<string, string>, statusSpan: HTMLElement, levelSelect: HTMLSelectElement, renderGameState: (state: any) => void) {
  socket.addEventListener("open", () => {
    statusSpan.textContent = "Connected";
    Object.entries(controllerIds).forEach(([_, ctrlId]) => {
      socket.send(
        JSON.stringify({
          type: "init",
          clientId: ctrlId,
          playerName: getPlayerName(ctrlId),
        })
      );
    });
  });
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "state") {
      renderGameState(msg.state);
    } else if (msg.type === "level") {
      levelSelect.value = msg.levelId;
    }
  });
  socket.addEventListener("close", () => {
    statusSpan.textContent = "Disconnected";
  });
  socket.addEventListener("error", () => {
    statusSpan.textContent = "Error";
  });
}
