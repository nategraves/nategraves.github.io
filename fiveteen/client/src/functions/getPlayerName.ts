import type { PlayerState } from "../types/index.js";

const controllerPlayerNames = new Map<string, string>();

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
    ) as string;
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

// export controllerPlayerNames map for external use
export const controllerPlayerNamesMap = controllerPlayerNames;
