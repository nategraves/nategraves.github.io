import { InputState } from '../types';
import { GameObject } from '../types';
import { log } from '../utils';

/**
 * Handles keydown events for movement and control
 */
export function handleKeyDown(
  event: KeyboardEvent,
  player: GameObject,
  inputState: InputState,
  vMax: number,
  deltaTime: number
): void {
  const damper = 0.8;
  switch (event.key) {
    case 'p':
      inputState.p = true;
      break;
    case 'r':
      inputState.r = true;
      break;
    case 'q':
      inputState.q = true;
      break;
    case 'w':
    case 'ArrowUp':
      player.vy = Math.max(-vMax, (player.vy - deltaTime) * damper);
      inputState.up = true;
      break;
    case 's':
    case 'ArrowDown':
      player.vy = Math.min(vMax, (player.vy + deltaTime) * damper);
      inputState.down = true;
      break;
    case 'a':
    case 'ArrowLeft':
      player.vx = Math.max(-vMax, (player.vx - deltaTime) * damper);
      inputState.left = true;
      break;
    case 'd':
    case 'ArrowRight':
      player.vx = Math.min(vMax, (player.vx + deltaTime) * damper);
      inputState.right = true;
      break;
    case ' ':
      inputState.space = true;
      player.vx = 0;
      player.vy = 0;
      break;
    case 'Shift':
      inputState.shift = true;
      break;
    case 'Control':
      inputState.ctrl = true;
      break;
    case 'Alt':
      inputState.alt = true;
      break;
    default:
      log('Unhandled key down', { key: event.key });
      break;
  }
}

/**
 * Handles keyup events for toggles and stopping movement input
 */
export function handleKeyUp(
  event: KeyboardEvent,
  player: GameObject,
  inputState: InputState,
  setupCollisionGrid: () => void
): void {
  switch (event.key) {
    case 'p':
      setupCollisionGrid(); // placeholder to reset state if needed
      inputState.p = false;
      break;
    case 'r':
      setupCollisionGrid();
      inputState.r = false;
      break;
    case 'q':
      inputState.q = false;
      break;
    case 'w':
    case 'ArrowUp':
      inputState.up = false;
      break;
    case 's':
    case 'ArrowDown':
      inputState.down = false;
      break;
    case 'a':
    case 'ArrowLeft':
      inputState.left = false;
      break;
    case 'd':
    case 'ArrowRight':
      inputState.right = false;
      break;
    case 'Shift':
      inputState.shift = false;
      break;
    case 'Control':
      inputState.ctrl = false;
      break;
    case 'Alt':
      inputState.alt = false;
      break;
    default:
      log('Unhandled key up', { key: event.key });
      break;
  }
}
