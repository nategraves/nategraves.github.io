export interface Player {
  id: string;
  playerName: string;
  ratioX: number;
  ratioY: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  score: number;
  team: number;
  teamColor: string; // Base color for the player's team, used for balloon color
  wetnessLevel: number;
  wetnessColor: string;
  isGrounded: boolean;
  prevJump: boolean;
  jumpsRemaining: number;
  prevTrigger: boolean;
  triggerStart: number | null;
  buttons: boolean[]; // Button pressed states
  axes: number[]; // Axes input state
  isUmbrellaOpen: boolean;
  umbrellaAngle: number;
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ownerId: string;
  team: number;
  power: number;
  teamColor: string;
}

export interface GameState {
  players: Player[];
  balloons: GameObject[];
  teamScores: number[];
  friendlyFireEnabled: boolean;
  gameOver: boolean;
  winningTeam: number | null;
  persistentPlayerStats: PlayerPersistentStats[];
  teamSessionWins: number[];
  teamNames: string[];
  // Tilemap data for level collision
  tilemap?: Tilemap | null; // Made optional and nullable
}

// Define tilemap structure matching Tiled JSON
export interface Tilemap {
  width: number;
  height: number;
  data: number[];
  tileSize: number;
}

export interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}

export interface TeamInfo {
  id: number; // Added to match player.team and usage
  name: string;
  hexColor: string; // Changed from hex for consistency
  cssColor: string;
}

export interface GameSettings {
  // Added GameSettings interface (mirroring kvStore.ts)
  teamScores: number[];
  gameOver: boolean;
  winningTeam: number | null;
  friendlyFireEnabled: boolean;
  teamSessionWins: number[];
  nextTeam: number;
  // teamNames: string[]; // This was commented out in kvStore, keeping consistent
}

export interface GameConstants {
  LEVEL_WIDTH: number;
  LEVEL_HEIGHT: number;
  HALF_W: number;
  HALF_H: number;
  PLAYER_RADIUS_PX: number;
  PLAYER_RADIUS_RATIO_X: number;
  PLAYER_RADIUS_RATIO_Y: number;
  MAX_RATIO_X: number;
  MAX_RATIO_Y: number;
  GRAVITY: number;
  JUMP_VELOCITY: number;
  THROW_SPEED: number;
  DEAD_ZONE: number;
  MAX_CHARGE_TIME: number;
  MAX_WETNESS: number;
  WETNESS_PER_HIT: number;
  PLAYER_DRYING_RATE_CONST: number;
  TERMINAL_VELOCITY_CONST: number;
  UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER: number;
  UMBRELLA_DEFAULT_ANGLE: number;
  UMBRELLA_MAX_REACH_MULTIPLIER: number;
  BASE_MOVE_SPEED: number;
  BASE_UMBRELLA_DISTANCE_RATIO: number;
  MOVE_SPEED: number;
  JUMP_MULTIPLIER: number;
  BALLOON_RADIUS_PX: number;
  BALLOON_RADIUS_RATIO: number;
  COLLISION_RADIUS: number; // This might be the same as PLAYER_RADIUS_RATIO_X
  MAX_JUMPS_CONST: number;
  POINTS_TO_WIN: number;
  AIM_OFFSET_PX_CONST: number;
  PLAYER_HEIGHT_RATIO: number; // Added missing property
  UMBRELLA_TERMINAL_VELOCITY: number; // Added missing property
  UMBRELLA_GRAVITY_MULTIPLIER: number; // Added missing property
  UMBRELLA_WIDTH_RATIO: number; // Added missing property
  UMBRELLA_HEIGHT_RATIO: number; // Added missing property
  UMBRELLA_OFFSET_Y_RATIO?: number; // Added missing property
  UMBRELLA_SPREAD_ANGLE: number; // Added for umbrella collision detection
}
