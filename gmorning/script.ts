// Import shared types and utilities
import { GameObject, InputState } from './src/types';
import { log } from './src/utils';
import { setupCollisionGrid } from './src/grid';
import { handleKeyDown, handleKeyUp, handleClick, handleMouseMove } from './src/input';
import { updateObjectPositions } from './src/update/updateObjectPositions';
import { checkCollisions } from './src/grid/checkCollisions';
import { drawObjects } from './src/render/drawObjects';
import { drawShield } from './src/render/drawShield';

const PLAYER_SIZE = 14;

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let pause = false;

let height: number;
let width: number;
let player: GameObject = {
  id: 'player',
  size: PLAYER_SIZE,
  x: -1000,
  y: -1000,
  vx: 0,
  vy: 0,
  alive: false,
  dieOnCollision: false,
  dob: Date.now(),
  color: 'green',
  score: 0,
};
let gameObjects: GameObject[] = [];
let deltaTime = 0;
let lastTime = 0;
let perfectFrameTime = 1000 / 60; // 60 FPS

const horizontalDivisions = 10;
const verticalDivisions = 10;

const vMax = 12;
const sizeMax = 10;
const sizeMin = 5;

const inputState: InputState = {
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
  p: false, // Pause toggle
  r: false, // Reset objects
  q: false, // Toggle debug mode
};

function init() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  canvas.addEventListener('click', (event) =>
    handleClick(event, false, player, gameObjects, inputState, width, height, sizeMin, sizeMax)
  );
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    handleClick(event, true, player, gameObjects, inputState, width, height, sizeMin, sizeMax);
  });
  document.addEventListener('mousemove', (event) => handleMouseMove(event, inputState));
  document.addEventListener('keydown', (event) =>
    handleKeyDown(event, player, inputState, vMax, deltaTime)
  );
  document.addEventListener('keyup', (event) =>
    handleKeyUp(event, player, inputState, () =>
      setupCollisionGrid(horizontalDivisions, verticalDivisions)
    )
  );

  onResize();
  setupCollisionGrid(horizontalDivisions, verticalDivisions);
  requestAnimationFrame(update);
}

function update(timestamp: number) {
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

// Resize handler
function onResize() {
  height = window.innerHeight;
  width = window.innerWidth;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  log('Window resized', { width, height });
}

// Start
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', onResize);
