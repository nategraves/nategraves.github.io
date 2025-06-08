"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tilesets = exports.layers = exports.mapHeight = exports.mapWidth = exports.tileSize = void 0;
// filepath: server/src/constants/tilemap.ts
const level1_json_1 = __importDefault(require("../../maps/level1.json"));
exports.tileSize = level1_json_1.default.tilewidth;
exports.mapWidth = level1_json_1.default.width;
exports.mapHeight = level1_json_1.default.height;
exports.layers = level1_json_1.default.layers;
exports.tilesets = level1_json_1.default.tilesets;
