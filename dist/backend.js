"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path = __importStar(require("path"));
const multiMap_json_1 = __importDefault(require("./multiMap.json"));
// Initialize Express and Socket.IO
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    pingInterval: 2000,
    pingTimeout: 5000,
});
// Map Data
const map = multiMap_json_1.default.layers[0].data;
const map2 = multiMap_json_1.default.layers[1].data;
const foregroundMap = multiMap_json_1.default.layers[2].data;
const obstacles = setObstacles(multiMap_json_1.default.layers[3].data);
const obstacleWidth = 64;
const obstacleHeight = 64;
console.log(obstacles);
// Constants
const port = 3000;
const GAMEWIDTH = 32 * 64;
const GAMEHEIGHT = 32 * 64;
const SPEED = 3;
const RADIUS = 15;
const PROJECTILE_RADIUS = 4;
// Game State
const backEndPlayers = {};
const backEndProjectiles = {};
const backEndEnemies = {};
// Initialize one enemy on startup
let enemyId = 0;
backEndEnemies[enemyId] = {
    x: 500,
    y: 500,
    color: "red",
    health: 100,
    radius: 15,
    velocity: { x: 0, y: 10 },
    targetPlayerId: "",
};
let projectileId = 0;
// Static Files
app.use(express_1.default.static("public"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
// Socket.IO Connection Handler
io.on("connection", (socket) => {
    console.log("a user connected");
    io.emit("map", { map, map2, foregroundMap });
    io.emit("updatePlayers", backEndPlayers);
    socket.on("mousemove", ({ angle }) => {
        const player = backEndPlayers[socket.id];
        if (player) {
            player.angle = angle;
        }
    });
    socket.on("shoot", ({ x, y, angle }) => {
        projectileId++;
        const velocity = {
            x: Math.cos(angle) * 8,
            y: Math.sin(angle) * 8,
        };
        backEndProjectiles[projectileId] = {
            x,
            y,
            velocity,
            playerId: socket.id,
            radius: PROJECTILE_RADIUS,
        };
    });
    socket.on("initGame", ({ username, devicePixelRatio }) => {
        let x = 0;
        let y = 0;
        do {
            x = (GAMEWIDTH - 256) * Math.random() + 128;
            y = (GAMEHEIGHT - 256) * Math.random() + 128;
        } while (obstacleCollision(x - 16, y - 32, 32, 64));
        backEndPlayers[socket.id] = {
            x,
            y,
            color: `hsl(${255 * Math.random()},100%,50%)`,
            sequenceNumber: 0,
            score: 0,
            username,
            health: 100,
            angle: 0,
            radius: RADIUS,
        };
    });
    socket.on("disconnect", (reason) => {
        console.log(reason);
        delete backEndPlayers[socket.id];
        io.emit("updatePlayers", backEndPlayers);
    });
    socket.on("keydown", ({ keycode, sequenceNumber }) => {
        const backEndPlayer = backEndPlayers[socket.id];
        if (!backEndPlayer)
            return;
        backEndPlayer.sequenceNumber = sequenceNumber;
        switch (keycode) {
            case "KeyA":
                backEndPlayer.x -= SPEED;
                if (backEndPlayer.x - backEndPlayer.radius < 64) {
                    backEndPlayer.x = backEndPlayer.radius + 64;
                }
                if (obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)) {
                    backEndPlayer.x += SPEED;
                }
                break;
            case "KeyW":
                backEndPlayer.y -= SPEED;
                if (backEndPlayer.y - backEndPlayer.radius < 96) {
                    backEndPlayer.y = backEndPlayer.radius + 96;
                }
                if (obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)) {
                    backEndPlayer.y += SPEED;
                }
                break;
            case "KeyS":
                backEndPlayer.y += SPEED;
                if (backEndPlayer.y + backEndPlayer.radius > GAMEHEIGHT - 64) {
                    backEndPlayer.y = GAMEHEIGHT - backEndPlayer.radius - 64;
                }
                if (obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)) {
                    backEndPlayer.y -= SPEED;
                }
                break;
            case "KeyD":
                backEndPlayer.x += SPEED;
                if (backEndPlayer.x + backEndPlayer.radius > GAMEWIDTH - 64) {
                    backEndPlayer.x = GAMEWIDTH - backEndPlayer.radius - 64;
                }
                if (obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)) {
                    backEndPlayer.x -= SPEED;
                }
                break;
        }
    });
});
// Backend Ticker
setInterval(() => {
    // Update enemy position
    for (const enemyIdKey in backEndEnemies) {
        const enemy = backEndEnemies[enemyIdKey];
        enemy.x += enemy.velocity.x;
        enemy.y += enemy.velocity.y;
        if (enemy.y + enemy.radius >= GAMEHEIGHT - 64 || enemy.y - enemy.radius <= 64) {
            enemy.velocity.y = -enemy.velocity.y;
        }
    }
    // Update projectile positions
    for (const id in backEndProjectiles) {
        const projectile = backEndProjectiles[id];
        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;
        if (obstacleCollision(projectile.x, projectile.y, PROJECTILE_RADIUS * 2, PROJECTILE_RADIUS * 2)) {
            delete backEndProjectiles[id];
            continue;
        }
        if (projectile.x + PROJECTILE_RADIUS < 0 ||
            projectile.x - PROJECTILE_RADIUS > GAMEWIDTH ||
            projectile.y + PROJECTILE_RADIUS < 0 ||
            projectile.y - PROJECTILE_RADIUS > GAMEHEIGHT) {
            delete backEndProjectiles[id];
            continue;
        }
        for (const playerId in backEndPlayers) {
            const backEndPlayer = backEndPlayers[playerId];
            const DISTANCE = Math.hypot(projectile.x - backEndPlayer.x, projectile.y - backEndPlayer.y);
            // Collision detection
            if (DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
                projectile.playerId !== playerId) {
                backEndPlayer.health -= 20;
                if (backEndPlayer.health <= 0) {
                    resetPlayer(backEndPlayer);
                    const shooter = backEndPlayers[projectile.playerId];
                    if (shooter) {
                        shooter.score += 1;
                    }
                }
                io.emit("projectileHit", {
                    hitPosition: {
                        x: projectile.x,
                        y: projectile.y,
                    },
                    velocity: {
                        x: projectile.velocity.x,
                        y: projectile.velocity.y,
                    },
                });
                delete backEndProjectiles[id];
                break;
            }
        }
    }
    io.emit("updateProjectiles", backEndProjectiles);
    io.emit("updatePlayers", backEndPlayers);
    io.emit("updateEnemies", backEndEnemies);
}, 15);
// Start Server
server.listen(port, () => {
    console.log(`backend app listen on port ${port}`);
});
// Helper Functions
function setObstacles(map) {
    const obstacles = [];
    for (let i = 0; i < 32 * 32; i++) {
        if (map[i] !== 0) {
            obstacles.push({
                x: Math.floor((i % 32) * 64),
                y: Math.floor(i / 32) * 64,
            });
        }
    }
    return obstacles;
}
function obstacleCollision(x, y, width, height) {
    for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        if (x < o.x + obstacleWidth &&
            x + width > o.x &&
            y < o.y + obstacleHeight &&
            y + height > o.y) {
            return true;
        }
    }
    return false;
}
function resetPlayer(player) {
    let x = 0;
    let y = 0;
    do {
        x = (GAMEWIDTH - 100) * Math.random() + 50;
        y = (GAMEHEIGHT - 200) * Math.random() + 100;
    } while (obstacleCollision(x - 16, y - 32, 32, 64));
    player.x = x;
    player.y = y;
    player.health = 100;
    console.log("huhu");
}
//# sourceMappingURL=backend.js.map