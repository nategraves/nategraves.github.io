"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePlayer = initializePlayer;
exports.randomFloorPosition = randomFloorPosition;
const index_1 = require("../constants/index");
const index_js_1 = require("../constants/index.js");
function initializePlayer(controllerId, playerName, teamIdx, ratioX, ratioY) {
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
        wetnessColor: index_1.TEAM_INFO[teamIdx].hex,
        isGrounded: true,
        prevJump: false,
        jumpsRemaining: index_js_1.MAX_JUMPS_CONST,
        prevTrigger: false,
        triggerStart: null,
        buttons: Array(16).fill(false),
        isUmbrellaOpen: false,
        umbrellaAngle: index_js_1.UMBRELLA_DEFAULT_ANGLE,
    };
}
function randomFloorPosition() {
    const minX = -index_js_1.MAX_RATIO_X;
    const maxX = index_js_1.MAX_RATIO_X;
    const randomX = Math.random() * (maxX - minX) + minX;
    return { ratioX: randomX, ratioY: index_js_1.MAX_RATIO_Y - index_js_1.PLAYER_HEIGHT_RATIO };
}
