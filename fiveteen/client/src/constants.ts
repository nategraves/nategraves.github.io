// Player
export const PLAYER_RADIUS = 20;
export const AIM_OFFSET = 38; // Distance from player center to aim indicator center
export const AIM_RADIUS = 5; // Radius of the aim indicator
export const DEAD_ZONE = 0.05; // For gamepad analog sticks
export const PLAYER_NAME_FONT = "bold 12px Arial";
export const PLAYER_NAME_OFFSET_Y = 5; // Vertical offset for player name from player circle

// Balloon
export const BALLOON_RADIUS = 8;

// Scoring & UI
export const SCORE_FONT = "bold 20px Arial";
export const TEAM_HEX_COLORS = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00"]; // Red, Blue, Green, Yellow
export const TEAM_DISPLAY_NAMES = ["Team 1", "Team 2", "Team 3", "Team 4"]; // Default display names

// Wetness
export const MAX_WETNESS = 100; // Matches server-side GameConstant
export const WETNESS_RADIUS = PLAYER_RADIUS; // Wetness indicator can be same size as player

// Rendering
export const LERP_FACTOR = 0.3; // For smoothing player movement

// Umbrella
export const UMBRELLA_WIDTH_PX = PLAYER_RADIUS * 4;
export const UMBRELLA_THICKNESS_PX = PLAYER_RADIUS * 0.5;
export const UMBRELLA_HANDLE_LENGTH_PX = PLAYER_RADIUS * 1.5; // Visual length, can be adjusted
export const UMBRELLA_HANDLE_THICKNESS_PX = PLAYER_RADIUS * 0.25;
export const BASE_UMBRELLA_OFFSET_Y_PX = PLAYER_RADIUS + 5; // Base Y offset from player center
export const UMBRELLA_MAX_REACH_MULTIPLIER_CLIENT = 2.0; // How much further the umbrella can reach based on aim
