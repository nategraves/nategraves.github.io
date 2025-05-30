var PLAYER_SIZE = 14;
var canvas, ctx;
var debug = true;
var pause = false;
var height, width;
var player = {
    id: "player",
    size: PLAYER_SIZE,
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    alive: false,
    dieOnCollision: false,
    dob: Date.now(),
    color: "green",
    score: 0,
};
var gameObjects = [];
var deltaTime = 0;
var lastTime = 0;
var perfectFrameTime = 1000 / 60; // 60 FPS
var collisions = {};
var horizontalDivisions = 10;
var verticalDivisions = 10;
var vMax = 12;
var sizeMax = 10;
var sizeMin = 5;
var inputState = {
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
function checkCollisions() {
    var _a;
    for (var cellId in collisions) {
        var cellObjects = collisions[cellId];
        if (!cellObjects || cellObjects.length === 0) {
            continue; // Not enough objects in this cell
        }
        for (var i = 0; i < cellObjects.length; i++) {
            var objA = cellObjects[i];
            for (var j = i + 1; j < cellObjects.length; j++) {
                var objB = cellObjects[j];
                if (objB == null || objA === objB)
                    continue;
                var dx = objA.x - objB.x;
                var dy = objA.y - objB.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                var minDistance = objA.size + objB.size;
                if (distance > minDistance) {
                    continue;
                }
                // Collision detected
                // log('Collision detected', { objA, objB });
                if (objA.dieOnCollision) {
                    objA.alive = false;
                }
                if (objB.dieOnCollision) {
                    objB.alive = false;
                }
                if (objA.id === "player" || objB.id === "player") {
                    // If one of the objects is the player, increase the score
                    var playerObj = objA.id === "player" ? objA : objB;
                    playerObj.score = ((_a = playerObj.score) !== null && _a !== void 0 ? _a : 0) + 1;
                    log("Player score increased", { score: playerObj.score });
                }
                // Handle collision response (e.g., bounce off)
                var angle = Math.atan2(dy, dx);
                var speedA = Math.sqrt(objA.vx * objA.vx + objA.vy * objA.vy);
                var speedB = Math.sqrt(objB.vx * objB.vx + objB.vy * objB.vy);
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
    var _a;
    for (var id in gameObjects) {
        var obj = gameObjects[id];
        if (obj == null || !obj.x || !obj.y || !obj.size || !obj.alive) {
            continue;
        }
        ctx.fillStyle = (_a = obj.color) !== null && _a !== void 0 ? _a : "black";
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function getGridCell(x, y) {
    var cellWidth = width / horizontalDivisions;
    var cellHeight = height / verticalDivisions;
    var i = Math.floor(x / cellWidth);
    var j = Math.floor(y / cellHeight);
    return "".concat(i, "-").concat(j);
}
function handleClick(event, isRightClick) {
    if (isRightClick === void 0) { isRightClick = false; }
    var x = event.clientX, y = event.clientY;
    if (gameObjects.length === 0) {
        // Create the player object if it doesn't exist
        player.x = x;
        player.y = y;
        player.alive = true;
        gameObjects.push(player);
        var cellId_1 = getGridCell(player.x, player.y);
        collisions[cellId_1].push(player);
        return;
    }
    var vector = {
        x: inputState.mouseX - player.x,
        y: inputState.mouseY - player.y,
    };
    var normalizedVector = {
        x: vector.x / Math.sqrt(vector.x * vector.x + vector.y * vector.y),
        y: vector.y / Math.sqrt(vector.x * vector.x + vector.y * vector.y),
    };
    var speed = randomInt(1, vMax);
    var vx = normalizedVector.x * speed;
    var vy = normalizedVector.y * speed;
    // Add a new object at the click position
    var id = gameObjects.length;
    var size = randomInt(sizeMin, sizeMax);
    var positionOffset = size + player.size / 2; // Offset to avoid overlap with player
    var newObject = {
        id: id,
        x: player.x + (vx > 0 ? positionOffset : -positionOffset), // Offset to avoid overlap with player
        y: player.y + (vy > 0 ? positionOffset : -positionOffset), // Offset to avoid overlap with player
        vx: vx,
        vy: vy,
        size: size,
        dieOnCollision: true,
        alive: true,
        dob: Date.now(),
        score: 0,
        color: isRightClick ? "blue" : "red",
    };
    gameObjects.push(newObject);
    var cellId = getGridCell(x, y);
    collisions[cellId].push(gameObjects[id]);
}
function handleKeyDown(event) {
    var damper = 0.8;
    switch (event.key) {
        case "p":
            inputState.p = true;
            break;
        case "r":
            inputState.r = true;
            break;
        case "q":
            inputState.q = true;
            break;
        // Move player up
        case "w":
        case "ArrowUp":
            player.vy = Math.max(-vMax, (player.vy - deltaTime) * damper);
            inputState.up = true;
            break;
        // Move player down
        case "s":
        case "ArrowDown":
            player.vy = Math.min(vMax, (player.vy + deltaTime) * damper);
            inputState.down = true;
            break;
        // Move player left
        case "a":
        case "ArrowLeft":
            player.vx = Math.max(-vMax, (player.vx - deltaTime) * damper);
            inputState.left = true;
            break;
        // Move player right
        case "d":
        case "ArrowRight":
            player.vx = Math.min(vMax, (player.vx + deltaTime) * damper);
            inputState.right = true;
            break;
        case " ":
            inputState.space = true;
            player.vx = 0; // Stop player movement
            player.vy = 0; // Stop player movement
            break;
        case "Shift":
            inputState.shift = true;
            break;
        case "Control":
            inputState.ctrl = true;
            break;
        case "Alt":
            inputState.alt = true;
            break;
        default:
            log("Unhandled key down", { key: event.key });
            break;
    }
}
function handleKeyUp(event) {
    switch (event.key) {
        case "p":
            pause = !pause;
            inputState.p = false;
            break;
        case "r":
            gameObjects = [];
            setupCollisionGrid(); // Reset the collision grid
            if (player) {
                player.x = -1000;
                player.y = -1000;
            }
            inputState.r = false;
            break;
        case "q":
            debug = !debug;
            inputState.q = false;
            break;
        case "w":
        case "ArrowUp":
            inputState.up = false;
            break;
        case "s":
        case "ArrowDown":
            inputState.down = false;
            break;
        case "a":
        case "ArrowLeft":
            inputState.left = false;
            break;
        case "d":
        case "ArrowRight":
            inputState.right = false;
            break;
        default:
            log("Unhandled key up", { key: event.key });
            break;
    }
}
function handleMouseMove(event) {
    var x = event.clientX, y = event.clientY;
    inputState.mouseX = x;
    inputState.mouseY = y;
}
function init() {
    canvas = document.getElementById("canvas");
    if (!canvas) {
        throw new Error("Canvas not found");
    }
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Prevent the context menu from appearing
        handleClick(event, true); // Right click
    });
    onResize();
    setupCollisionGrid();
    requestAnimationFrame(update);
    ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas context not found");
    }
}
function log(message, data) {
    if (!debug)
        return;
    if (data) {
        console.log(message, data);
    }
    else {
        console.log(message);
    }
}
function onResize() {
    height = window.innerHeight;
    width = window.innerWidth;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "".concat(width, "px");
    canvas.style.height = "".concat(height, "px");
    log("Window resized", { width: width, height: height });
    // TODO: Recalculate the collision grid
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function resetCollisionGrid() {
    for (var cellId in collisions) {
        collisions[cellId] = [];
    }
    // Populate the collision grid with objects
    for (var id in gameObjects) {
        var obj = gameObjects[id];
        if (!obj || !obj.x || !obj.y || !obj.size || !obj.alive) {
            continue;
        }
        var cellId = getGridCell(obj.x, obj.y);
        // Check if the cellId is valid
        if (!collisions[cellId]) {
            continue;
        }
        collisions[cellId].push(obj);
    }
}
function setupCollisionGrid() {
    for (var i = 0; i < horizontalDivisions; i++) {
        for (var j = 0; j < verticalDivisions; j++) {
            var cellId = "".concat(i, "-").concat(j);
            collisions[cellId] = [];
        }
    }
}
function update(timestamp) {
    deltaTime = (timestamp - lastTime) / perfectFrameTime;
    lastTime = timestamp;
    if (pause) {
        requestAnimationFrame(update);
        return; // Skip the update if paused
    }
    // Each frame, clear the canvas
    ctx.clearRect(0, 0, width, height);
    updateObjectPositions();
    resetCollisionGrid();
    checkCollisions();
    drawObjects();
    requestAnimationFrame(update);
}
function updateObjectPositions() {
    var _a, _b;
    for (var id in gameObjects) {
        var obj = gameObjects[id];
        if (obj == null || !obj.x || !obj.y || !obj.size || !obj.alive) {
            continue;
        }
        obj.x += obj.vx;
        obj.y += obj.vy;
        // Check for collisions with the walls
        if (obj.x < ((_a = obj.size) !== null && _a !== void 0 ? _a : 0) ||
            obj.x > (obj.size ? width - obj.size : width)) {
            obj.vx *= -1;
        }
        if (obj.y < ((_b = obj.size) !== null && _b !== void 0 ? _b : 0) || obj.y > height - obj.size / 2) {
            obj.vy *= -1;
        }
    }
}
// Call start on page load
window.addEventListener("DOMContentLoaded", init);
// Call onResize on window resize
window.addEventListener("resize", onResize);
// Handle mouse movement
document.addEventListener("mousemove", handleMouseMove);
// Handle key presses
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
