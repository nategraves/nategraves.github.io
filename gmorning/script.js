let canvas, ctx;
let debug = true;

let height, width;

const objects = [];
const collisions = {};

const horizontalDivisions = 10;
const verticalDivisions = 10;

const vMax = 5;
const sizeMax = 10;
const sizeMin = 5;

function checkCollisions() {
  for (const cellId in collisions) {
    const cellObjects = collisions[cellId];

    for (let i = 0; i < cellObjects.length; i++) {
      const objA = cellObjects[i];

      const xCollision = objA.x < 0 || objA.x > width;
      const yCollision = objA.y < 0 || objA.y > height;

      if (objA.dieOnCollision && (xCollision || yCollision)) {
        objects[objA.id] = null;
        collisions[cellId].splice(i, 1);
      }

      // Check for collision between objA and the walls
      if (objA.x < 0 || objA.x > width) {
        objA.vx *= -1;
      } else if (objA.y < 0 || objA.y > height) {
        objA.vy *= -1;
      }

      for (let j = i + 1; j < cellObjects.length; j++) {
        const objB = cellObjects[j];

        if (objB == null || objA === objB) continue;

          const dx = objA.x - objB.x;
          const dy = objA.y - objB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = objA.size + objB.size;

          if (distance > minDistance) {
            continue;
          }

          // Collision detected
          log('Collision detected', { objA, objB });

          if (objA.dieOnCollision) {
            objects[objA.id] = null;
            collisions[cellId].splice(i, 1);
          }

          if (objB.dieOnCollision) {
            objects[objB.id] = null;
            collisions[cellId].splice(j, 1);
          }

          // Handle collision response (e.g., bounce off)
          const angle = Math.atan2(dy, dx);
          const speedA = Math.sqrt(objA.vx * objA.vx + objA.vy * objA.vy);
          const speedB = Math.sqrt(objB.vx * objB.vx + objB.vy * objB.vy);

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

function drawObjects() {
  for (const id in objects) {
    const obj = objects[id];
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getGridCell(x, y) {
  const cellWidth = width / horizontalDivisions;
  const cellHeight = height / verticalDivisions;

  const i = Math.floor(x / cellWidth);
  const j = Math.floor(y / cellHeight);

  return `${i}-${j}`;
}

function log(message, data) {
  if (!debug) return;

  if (data) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}

function onClick(event) {
  const { clientX: x, clientY: y } = event;
  // Add a new object at the click position
  const id = Date.now();
  const size = randomInt(sizeMin, sizeMax);
  let vx = 0;
  let vy = 0;
  // Ensure vx and vy are not both zero
  while (vx === 0 && vy === 0) {
    vx = randomInt(-vMax, vMax);
    vy = randomInt(-vMax, vMax);
  }
  objects[id] = { x, y, vx, vy, size, dieOnCollision: true };
  const cellId = getGridCell(x, y);
  collisions[cellId].push(objects[id]);
  log('New object added', { id, x, y, vx, vy });
}

function onResize() {
  height = window.innerHeight;
  width = window.innerWidth;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  log('Window resized', { width, height });

  // TODO: Recalculate the collision grid
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resetCollisionGrid() {
  for (const cellId in collisions) {
    collisions[cellId] = [];
  }

  // Populate the collision grid with objects
  for (const id in objects) {
    const obj = objects[id];
    const cellId = getGridCell(obj.x, obj.y);
    // Check if the cellId is valid
    if (!collisions[cellId]) {
      continue;
    }
    collisions[cellId].push(obj);
  }
}

function setupCollisionGrid() {
  for (let i = 0; i < horizontalDivisions; i++) {
    for (let j = 0; j < verticalDivisions; j++) {
      const cellId = `${i}-${j}`;
      collisions[cellId] = [];
    }
  }
}

function init() {
  canvas = document.getElementById('canvas');
  canvas.addEventListener('click', onClick);

  onResize();
  setupCollisionGrid();

  requestAnimationFrame(update);
  if (!canvas) {
    log('Canvas not found');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    log('Canvas context not found');
    return;
  }
}

function update() {
  // Each frame, clear the canvas
  ctx.clearRect(0, 0, width, height);

  updateObjects();
  resetCollisionGrid();
  checkCollisions();
  drawObjects();

  requestAnimationFrame(update);
}

function updateObjects() {
  for (const id in objects) {
    const obj = objects[id];
    obj.x += obj.vx;
    obj.y += obj.vy;

    // Check for collisions with the walls
    if (obj.x < 0 || obj.x > width) {
      obj.vx *= -1;
    }
    if (obj.y < 0 || obj.y > height) {
      obj.vy *= -1;
    }
  }
}

// Call start on page load
window.addEventListener('DOMContentLoaded', init);
// Call onResize on window resize
window.addEventListener('resize', onResize);
