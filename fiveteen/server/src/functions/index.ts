import { TEAM_INFO } from '../constants/index';
import { MAX_JUMPS_CONST, UMBRELLA_DEFAULT_ANGLE, MAX_RATIO_X, MAX_RATIO_Y, PLAYER_HEIGHT_RATIO } from '../constants/index.js';

export function initializePlayer(controllerId: string, playerName: string, teamIdx: number, ratioX: number, ratioY: number) {
  return {
    id: controllerId,
    playerName,
    ratioX,
    ratioY,
    vx: 0,
    vy: 0,
    aimX: 0,
    aimY: 0,
    score: 0,
    team: teamIdx,
    wetnessLevel: 0,
    wetnessColor: TEAM_INFO[teamIdx].hex,
    isGrounded: true,
    prevJump: false,
    jumpsRemaining: MAX_JUMPS_CONST,
    prevTrigger: false,
    triggerStart: null,
    buttons: Array(16).fill(false),
    isUmbrellaOpen: false,
    umbrellaAngle: UMBRELLA_DEFAULT_ANGLE,
  };
}

export function randomFloorPosition() {
  const minX = -MAX_RATIO_X;
  const maxX = MAX_RATIO_X;
  const randomX = Math.random() * (maxX - minX) + minX;
  return { ratioX: randomX, ratioY: MAX_RATIO_Y - PLAYER_HEIGHT_RATIO };
}
