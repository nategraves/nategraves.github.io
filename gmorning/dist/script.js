// src/utils/index.ts
function log(message, data) {
  if (data !== void 0) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getGridCell(x, y, width2, height2, horizontalDivs, verticalDivs) {
  const cellWidth = width2 / horizontalDivs;
  const cellHeight = height2 / verticalDivs;
  const i = Math.floor(x / cellWidth);
  const j = Math.floor(y / cellHeight);
  return `${i}-${j}`;
}

// src/grid/collisionGrid.ts
var collisions = {};
var activeCells = /* @__PURE__ */ new Set();
function setupCollisionGrid(horizontalDivisions2, verticalDivisions2) {
  for (let i = 0; i < horizontalDivisions2; i++) {
    for (let j = 0; j < verticalDivisions2; j++) {
      const cellId = `${i}-${j}`;
      collisions[cellId] = [];
    }
  }
  activeCells.clear();
}

// src/grid/checkCollisions.ts
function checkCollisions() {
  var _a;
  for (const cellId of activeCells) {
    const cellObjects = collisions[cellId];
    if (!cellObjects || cellObjects.length === 0)
      continue;
    for (let i = 0; i < cellObjects.length; i++) {
      const objA = cellObjects[i];
      for (let j = i + 1; j < cellObjects.length; j++) {
        const objB = cellObjects[j];
        if (!objB || objA === objB)
          continue;
        const dx = objA.x - objB.x;
        const dy = objA.y - objB.y;
        const distSq = dx * dx + dy * dy;
        const minDist = objA.size + objB.size;
        if (distSq > minDist * minDist)
          continue;
        if (objA.dieOnCollision)
          objA.alive = false;
        if (objB.dieOnCollision)
          objB.alive = false;
        if (objA.id === "player" || objB.id === "player") {
          const playerObj = objA.id === "player" ? objA : objB;
          playerObj.score = ((_a = playerObj.score) != null ? _a : 0) + 1;
          log("Player score increased", { score: playerObj.score });
        }
        const angle = Math.atan2(dy, dx);
        const speedA = Math.hypot(objA.vx, objA.vy);
        const speedB = Math.hypot(objB.vx, objB.vy);
        if (!objA.dieOnCollision) {
          objA.vx = speedA * Math.cos(angle);
          objA.vy = speedA * Math.sin(angle);
        }
        if (!objB.dieOnCollision) {
          objB.vx = speedB * Math.cos(angle + Math.PI);
          objB.vy = speedB * Math.sin(angle + Math.PI);
        }
      }
    }
  }
}

// src/input/keyboard.ts
function handleKeyDown(event, player2, inputState2, vMax2, deltaTime2) {
  const damper = 0.8;
  switch (event.key) {
    case "p":
      inputState2.p = true;
      break;
    case "r":
      inputState2.r = true;
      break;
    case "q":
      inputState2.q = true;
      break;
    case "w":
    case "ArrowUp":
      player2.vy = Math.max(-vMax2, (player2.vy - deltaTime2) * damper);
      inputState2.up = true;
      break;
    case "s":
    case "ArrowDown":
      player2.vy = Math.min(vMax2, (player2.vy + deltaTime2) * damper);
      inputState2.down = true;
      break;
    case "a":
    case "ArrowLeft":
      player2.vx = Math.max(-vMax2, (player2.vx - deltaTime2) * damper);
      inputState2.left = true;
      break;
    case "d":
    case "ArrowRight":
      player2.vx = Math.min(vMax2, (player2.vx + deltaTime2) * damper);
      inputState2.right = true;
      break;
    case " ":
      inputState2.space = true;
      player2.vx = 0;
      player2.vy = 0;
      break;
    case "Shift":
      inputState2.shift = true;
      break;
    case "Control":
      inputState2.ctrl = true;
      break;
    case "Alt":
      inputState2.alt = true;
      break;
    default:
      log("Unhandled key down", { key: event.key });
      break;
  }
}
function handleKeyUp(event, player2, inputState2, setupCollisionGrid2) {
  switch (event.key) {
    case "p":
      setupCollisionGrid2();
      inputState2.p = false;
      break;
    case "r":
      setupCollisionGrid2();
      inputState2.r = false;
      break;
    case "q":
      inputState2.q = false;
      break;
    case "w":
    case "ArrowUp":
      inputState2.up = false;
      break;
    case "s":
    case "ArrowDown":
      inputState2.down = false;
      break;
    case "a":
    case "ArrowLeft":
      inputState2.left = false;
      break;
    case "d":
    case "ArrowRight":
      inputState2.right = false;
      break;
    case "Shift":
      inputState2.shift = false;
      break;
    case "Control":
      inputState2.ctrl = false;
      break;
    case "Alt":
      inputState2.alt = false;
      break;
    default:
      log("Unhandled key up", { key: event.key });
      break;
  }
}

// src/input/mouse.ts
function handleClick(event, isRightClick = false, player2, gameObjects2, inputState2, width2, height2, sizeMin2, sizeMax2) {
  const { clientX: x, clientY: y } = event;
  if (gameObjects2.length === 0) {
    player2.x = x;
    player2.y = y;
    player2.alive = true;
    gameObjects2.push(player2);
    const cellId2 = getGridCell(
      player2.x,
      player2.y,
      width2,
      height2,
      Math.ceil(width2 / sizeMin2),
      Math.ceil(height2 / sizeMin2)
    );
    collisions[cellId2].push(player2);
    player2.cellId = cellId2;
    activeCells.add(cellId2);
    return;
  }
  const vector = { x: inputState2.mouseX - player2.x, y: inputState2.mouseY - player2.y };
  const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  const normalized = { x: vector.x / mag, y: vector.y / mag };
  const vx = normalized.x * 4;
  const vy = normalized.y * 4;
  const id = gameObjects2.length;
  const size = randomInt(sizeMin2, sizeMax2);
  const offset = size + player2.size / 2;
  const newObj = {
    id,
    x: player2.x + (vx > 0 ? offset : -offset),
    y: player2.y + (vy > 0 ? offset : -offset),
    vx,
    vy,
    size,
    dieOnCollision: true,
    alive: true,
    dob: Date.now(),
    score: 0,
    color: isRightClick ? "blue" : "red"
  };
  gameObjects2.push(newObj);
  const cellId = getGridCell(
    newObj.x,
    newObj.y,
    width2,
    height2,
    Math.ceil(width2 / sizeMin2),
    Math.ceil(height2 / sizeMin2)
  );
  collisions[cellId].push(newObj);
  activeCells.add(cellId);
  newObj.cellId = cellId;
}
function handleMouseMove(event, inputState2) {
  inputState2.mouseX = event.clientX;
  inputState2.mouseY = event.clientY;
}

// src/update/updateObjectPositions.ts
function updateObjectPositions(gameObjects2, width2, height2) {
  for (const obj of gameObjects2) {
    if (!obj || !obj.alive)
      continue;
    obj.x += obj.vx;
    obj.y += obj.vy;
    if (obj.x < obj.size || obj.x > width2 - obj.size)
      obj.vx *= -1;
    if (obj.y < obj.size || obj.y > height2 - obj.size)
      obj.vy *= -1;
    const newCell = getGridCell(
      obj.x,
      obj.y,
      width2,
      height2,
      /*hDiv*/
      10,
      /*vDiv*/
      10
    );
    if (newCell !== obj.cellId) {
      const old = obj.cellId;
      if (old && collisions[old]) {
        const idx = collisions[old].indexOf(obj);
        if (idx > -1) {
          collisions[old].splice(idx, 1);
          if (collisions[old].length === 0)
            activeCells.delete(old);
        }
      }
      collisions[newCell].push(obj);
      activeCells.add(newCell);
      obj.cellId = newCell;
    }
  }
}

// src/render/drawObjects.ts
function drawObjects(ctx2, gameObjects2) {
  gameObjects2.forEach((obj) => {
    var _a;
    if (!obj || !obj.alive)
      return;
    ctx2.fillStyle = (_a = obj.color) != null ? _a : "black";
    ctx2.beginPath();
    ctx2.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
    ctx2.fill();
  });
}

// src/render/drawShield.ts
function drawShield(ctx2, player2, inputState2) {
  if (!player2.alive || !inputState2.shift)
    return;
  ctx2.strokeStyle = "black";
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(player2.x, player2.y);
  ctx2.lineTo(inputState2.mouseX, inputState2.mouseY);
  ctx2.stroke();
  ctx2.closePath();
  ctx2.beginPath();
  ctx2.arc(inputState2.mouseX, inputState2.mouseY, 0, 50, Math.PI);
  ctx2.stroke();
  ctx2.closePath();
}

// script.ts
var PLAYER_SIZE = 14;
var canvas;
var ctx;
var pause = false;
var height;
var width;
var player = {
  id: "player",
  size: PLAYER_SIZE,
  x: -1e3,
  y: -1e3,
  vx: 0,
  vy: 0,
  alive: false,
  dieOnCollision: false,
  dob: Date.now(),
  color: "green",
  score: 0
};
var gameObjects = [];
var deltaTime = 0;
var lastTime = 0;
var perfectFrameTime = 1e3 / 60;
var horizontalDivisions = 10;
var verticalDivisions = 10;
var vMax = 12;
var sizeMax = 10;
var sizeMin = 5;
var inputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  mouseX: 0,
  mouseY: 0,
  mouseRightDown: false,
  mouseLeftDown: false,
  space: false,
  shift: false,
  ctrl: false,
  alt: false,
  p: false,
  // Pause toggle
  r: false,
  // Reset objects
  q: false
  // Toggle debug mode
};
function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.addEventListener(
    "click",
    (event) => handleClick(event, false, player, gameObjects, inputState, width, height, sizeMin, sizeMax)
  );
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handleClick(event, true, player, gameObjects, inputState, width, height, sizeMin, sizeMax);
  });
  document.addEventListener("mousemove", (event) => handleMouseMove(event, inputState));
  document.addEventListener(
    "keydown",
    (event) => handleKeyDown(event, player, inputState, vMax, deltaTime)
  );
  document.addEventListener(
    "keyup",
    (event) => handleKeyUp(
      event,
      player,
      inputState,
      () => setupCollisionGrid(horizontalDivisions, verticalDivisions)
    )
  );
  onResize();
  setupCollisionGrid(horizontalDivisions, verticalDivisions);
  requestAnimationFrame(update);
}
function update(timestamp) {
  deltaTime = (timestamp - lastTime) / perfectFrameTime;
  lastTime = timestamp;
  if (!pause) {
    ctx.clearRect(0, 0, width, height);
    updateObjectPositions(gameObjects, width, height);
    checkCollisions();
    drawObjects(ctx, gameObjects);
    drawShield(ctx, player, inputState);
  }
  requestAnimationFrame(update);
}
function onResize() {
  height = window.innerHeight;
  width = window.innerWidth;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  log("Window resized", { width, height });
}
window.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", onResize);
//# sourceMappingURL=script.js.map
