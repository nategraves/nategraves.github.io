export const GRAVITY = 10;
export const JUMP_VELOCITY = -1.5;
export const THROW_SPEED = 5; // Updated from 3
export const MAX_JUMPS_CONST = 3;
export const DEAD_ZONE = 0.1;
export const MAX_CHARGE_TIME = 1250; // Updated from 1000
export const MAX_WETNESS = 100;
export const WETNESS_PER_HIT = 15;
export const PLAYER_DRYING_RATE_CONST = 5;
export const TERMINAL_VELOCITY_CONST = 2.5;
export const UMBRELLA_GRAVITY_MULTIPLIER = 0.5;
export const UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER = 0.85;
export const UMBRELLA_DEFAULT_ANGLE = 0;
export const UMBRELLA_MAX_REACH_MULTIPLIER = 3.0; // Restored
// export const BASE_UMBRELLA_DISTANCE_RATIO = 1.0; // Old placeholder
// Calculated based on client: (2 * PLAYER_RADIUS_PX + 5px offset) / HALF_W
// Assuming PLAYER_RADIUS_PX = 20, HALF_W = 500 (typical values from server/index.ts)
// (2 * 20 + 5) / 500 = 45 / 500 = 0.09
export const BASE_UMBRELLA_DISTANCE_RATIO = 0.09; 
export const UMBRELLA_SPREAD_ANGLE = Math.PI * 0.8; // How wide the umbrella arc is
export const BASE_MOVE_SPEED = 200;
export const MOVE_SPEED = BASE_MOVE_SPEED * 1.75;
export const JUMP_MULTIPLIER = 3;
export const MAX_RATIO_X = 1;
export const MAX_RATIO_Y = 1;
export const PLAYER_HEIGHT_RATIO = 0.1;
export const TEAM_INFO = [
  { name: "Team 1", color: "#f00", hex: "#f00" },
  { name: "Team 2", color: "#00f", hex: "#00f" },
];
