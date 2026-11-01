"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAM_INFO = exports.PLAYER_HEIGHT_RATIO = exports.MAX_RATIO_Y = exports.MAX_RATIO_X = exports.JUMP_MULTIPLIER = exports.MOVE_SPEED = exports.BASE_MOVE_SPEED = exports.UMBRELLA_SPREAD_ANGLE = exports.BASE_UMBRELLA_DISTANCE_RATIO = exports.UMBRELLA_MAX_REACH_MULTIPLIER = exports.UMBRELLA_DEFAULT_ANGLE = exports.UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER = exports.UMBRELLA_GRAVITY_MULTIPLIER = exports.TERMINAL_VELOCITY_CONST = exports.PLAYER_DRYING_RATE_CONST = exports.WETNESS_PER_HIT = exports.MAX_WETNESS = exports.MAX_CHARGE_TIME = exports.DEAD_ZONE = exports.MAX_JUMPS_CONST = exports.THROW_SPEED = exports.JUMP_VELOCITY = exports.GRAVITY = void 0;
exports.GRAVITY = 10;
exports.JUMP_VELOCITY = -1.5;
exports.THROW_SPEED = 5; // Updated from 3
exports.MAX_JUMPS_CONST = 3;
exports.DEAD_ZONE = 0.1;
exports.MAX_CHARGE_TIME = 1250; // Updated from 1000
exports.MAX_WETNESS = 100;
exports.WETNESS_PER_HIT = 15;
exports.PLAYER_DRYING_RATE_CONST = 5;
exports.TERMINAL_VELOCITY_CONST = 2.5;
exports.UMBRELLA_GRAVITY_MULTIPLIER = 0.5;
exports.UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER = 0.85;
exports.UMBRELLA_DEFAULT_ANGLE = 0;
exports.UMBRELLA_MAX_REACH_MULTIPLIER = 3.0; // Restored
// export const BASE_UMBRELLA_DISTANCE_RATIO = 1.0; // Old placeholder
// Calculated based on client: (2 * PLAYER_RADIUS_PX + 5px offset) / HALF_W
// Assuming PLAYER_RADIUS_PX = 20, HALF_W = 500 (typical values from server/index.ts)
// (2 * 20 + 5) / 500 = 45 / 500 = 0.09
exports.BASE_UMBRELLA_DISTANCE_RATIO = 0.09;
exports.UMBRELLA_SPREAD_ANGLE = Math.PI * 0.8; // How wide the umbrella arc is
exports.BASE_MOVE_SPEED = 200;
exports.MOVE_SPEED = exports.BASE_MOVE_SPEED * 1.75;
exports.JUMP_MULTIPLIER = 3;
exports.MAX_RATIO_X = 1;
exports.MAX_RATIO_Y = 1;
exports.PLAYER_HEIGHT_RATIO = 0.1;
exports.TEAM_INFO = [
    { name: "Team 1", color: "#f00", hex: "#f00" },
    { name: "Team 2", color: "#00f", hex: "#00f" },
];
