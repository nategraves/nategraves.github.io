import { TEAM_HEX_COLORS, TEAM_DISPLAY_NAMES } from "./constants";
import { sendWebSocketMessage } from "./network"; // For restart button

export interface Level {
  id: string;
  name: string;
}

let onLevelChangeCallback: ((newLevel: string) => void) | null = null;

export function setupUI(
  levels: Level[],
  currentLevelId: string,
  onLevelChange: (newLevel: string) => void
) {
  onLevelChangeCallback = onLevelChange;

  const uiDiv = document.createElement("div");
  uiDiv.id = "uiOverlay";
  uiDiv.style.position = "fixed";
  uiDiv.style.top = "10px";
  uiDiv.style.left = "10px";
  uiDiv.style.zIndex = "100";
  uiDiv.style.background = "rgba(255,255,255,0.8)";
  uiDiv.style.padding = "10px";
  uiDiv.style.border = "1px solid #ccc";
  uiDiv.style.borderRadius = "5px";
  uiDiv.style.fontFamily = "Arial, sans-serif";

  const levelSelect = document.createElement("select");
  levelSelect.id = "levelSelect";
  levels.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.text = l.name;
    levelSelect.appendChild(opt);
  });
  levelSelect.value = currentLevelId;
  levelSelect.addEventListener("change", () => {
    if (onLevelChangeCallback) {
      onLevelChangeCallback(levelSelect.value);
    }
  });
  uiDiv.appendChild(new Text("Level: "));
  uiDiv.appendChild(levelSelect);

  const statusSpan = document.createElement("span");
  statusSpan.id = "statusSpan";
  statusSpan.textContent = "Connecting...";
  statusSpan.style.marginLeft = "15px";
  uiDiv.appendChild(statusSpan);

  const teamScoresDiv = document.createElement("div");
  teamScoresDiv.id = "teamScoresDiv";
  teamScoresDiv.style.marginTop = "8px";
  teamScoresDiv.innerHTML = `Game Scores: 
    <span id="team0name" style="color: ${TEAM_HEX_COLORS[0]}; font-weight: bold;">${TEAM_DISPLAY_NAMES[0]}</span>: 
    <span id="team0score" style="font-weight: bold;">0</span> - 
    <span id="team1name" style="color: ${TEAM_HEX_COLORS[1]}; font-weight: bold;">${TEAM_DISPLAY_NAMES[1]}</span>: 
    <span id="team1score" style="font-weight: bold;">0</span>`;
  uiDiv.appendChild(teamScoresDiv);

  const sessionWinsDiv = document.createElement("div");
  sessionWinsDiv.id = "sessionWinsDiv";
  sessionWinsDiv.style.marginTop = "5px";
  sessionWinsDiv.innerHTML = `Session Wins: 
    <span id="team0sessionname" style="color: ${TEAM_HEX_COLORS[0]}; font-weight: bold;">${TEAM_DISPLAY_NAMES[0]}</span>: 
    <span id="team0sessionwins" style="font-weight: bold;">0</span> - 
    <span id="team1sessionname" style="color: ${TEAM_HEX_COLORS[1]}; font-weight: bold;">${TEAM_DISPLAY_NAMES[1]}</span>: 
    <span id="team1sessionwins" style="font-weight: bold;">0</span>`;
  uiDiv.appendChild(sessionWinsDiv);

  const ffStatusDiv = document.createElement("div");
  ffStatusDiv.id = "ffStatusDiv";
  ffStatusDiv.style.marginTop = "5px";
  ffStatusDiv.innerHTML = 'Friendly Fire: <span id="ffStatus" style="font-weight: bold;">ON</span>';
  uiDiv.appendChild(ffStatusDiv);

  // Mute button (functionality to be implemented)
  const muteButton = document.createElement("button");
  muteButton.id = "muteButton";
  muteButton.textContent = "Unmute Audio";
  muteButton.style.marginLeft = "10px";
  muteButton.style.padding = "2px 5px";
  // muteButton.onclick = () => { /* toggle mute state */ };
  // uiDiv.appendChild(muteButton); // Add when functionality is ready

  document.body.appendChild(uiDiv);
}

export function updateStatus(statusText: string) {
  const statusSpan = document.getElementById("statusSpan");
  if (statusSpan) {
    statusSpan.textContent = statusText;
  }
}

export function updateLevelInUI(levelId: string) {
  const levelSelect = document.getElementById("levelSelect") as HTMLSelectElement | null;
  if (levelSelect && levelSelect.value !== levelId) {
    levelSelect.value = levelId;
  }
}

export function manageRestartButton(isGameOver: boolean) {
  let restartButton = document.getElementById("restartButton");

  if (isGameOver) {
    if (!restartButton) {
      restartButton = document.createElement("button");
      restartButton.id = "restartButton";
      restartButton.textContent = "Restart Game";
      restartButton.style.position = "absolute";
      restartButton.style.left = "50%";
      restartButton.style.top = "calc(50% + 170px)"; 
      restartButton.style.transform = "translate(-50%, -50%)";
      restartButton.style.padding = "10px 20px";
      restartButton.style.fontSize = "20px";
      restartButton.style.cursor = "pointer";
      restartButton.style.background = "#4CAF50";
      restartButton.style.color = "white";
      restartButton.style.border = "none";
      restartButton.style.borderRadius = "5px";
      restartButton.onclick = () => {
        sendWebSocketMessage({ type: "restart_game" });
        // The button will be removed by the next call to manageRestartButton or renderGameState clearing it
      };
      document.body.appendChild(restartButton);
    }
  } else {
    if (restartButton) {
      restartButton.remove();
    }
  }
}
