import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import * as path from "path";
import mapData from "./multiMap.json";
import type {
  Velocity,
  Obstacle,
  Player,
  Projectile,
  Enemy,
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types";

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  pingInterval: 2000,
  pingTimeout: 5000,
});

// Map Data
const map = mapData.layers[0].data;
const map2 = mapData.layers[1].data;
const foregroundMap = mapData.layers[2].data;
const obstacles: Obstacle[] = setObstacles(mapData.layers[3].data);
const obstacleWidth = 64;
const obstacleHeight = 64;

// Constants
const port = 3000;
const GAMEWIDTH = 32 * 64;
const GAMEHEIGHT = 32 * 64;
const SPEED = 3;
const RADIUS = 15;
const PROJECTILE_RADIUS = 4;

// Game State
const backEndPlayers: Record<string, Player> = {};
const backEndProjectiles: Record<number, Projectile> = {};
const backEndEnemies: Record<number, Enemy> = {};

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
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Socket.IO Connection Handler
io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("a user connected");
  io.emit("map", { map, map2, foregroundMap });
  io.emit("updatePlayers", backEndPlayers);

  socket.on("mousemove", ({ angle }: { angle: number }) => {
    const player = backEndPlayers[socket.id];
    if (player) {
      player.angle = angle;
    }
  });

  socket.on("shoot", ({ x, y, angle }: { x: number; y: number; angle: number }) => {
    projectileId++;
    const velocity: Velocity = {
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

  socket.on("initGame", ({ username, devicePixelRatio }: { username: string; devicePixelRatio: number }) => {
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

  socket.on("disconnect", (reason: string) => {
    console.log(reason);
    delete backEndPlayers[socket.id];
    io.emit("updatePlayers", backEndPlayers);
  });

  socket.on("keydown", ({ keycode, sequenceNumber }: { keycode: string; sequenceNumber: number }) => {
    const backEndPlayer = backEndPlayers[socket.id];

    if (!backEndPlayer) return;

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

    if (
      obstacleCollision(
        projectile.x,
        projectile.y,
        PROJECTILE_RADIUS * 2,
        PROJECTILE_RADIUS * 2
      )
    ) {
      delete backEndProjectiles[id];
      continue;
    }

    if (
      projectile.x + PROJECTILE_RADIUS < 0 ||
      projectile.x - PROJECTILE_RADIUS > GAMEWIDTH ||
      projectile.y + PROJECTILE_RADIUS < 0 ||
      projectile.y - PROJECTILE_RADIUS > GAMEHEIGHT
    ) {
      delete backEndProjectiles[id];
      continue;
    }

    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId];

      const DISTANCE = Math.hypot(
        projectile.x - backEndPlayer.x,
        projectile.y - backEndPlayer.y
      );

      // Collision detection
      if (
        DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
        projectile.playerId !== playerId
      ) {
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
function setObstacles(map: number[]): Obstacle[] {
  const obstacles: Obstacle[] = [];
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

function obstacleCollision(x: number, y: number, width: number, height: number): boolean {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];

    if (
      x < o.x + obstacleWidth &&
      x + width > o.x &&
      y < o.y + obstacleHeight &&
      y + height > o.y
    ) {
      return true;
    }
  }
  return false;
}

function resetPlayer(player: Player): void {
  let x = 0;
  let y = 0;
  do {
    x = (GAMEWIDTH - 100) * Math.random() + 50;
    y = (GAMEHEIGHT - 200) * Math.random() + 100;
  } while (obstacleCollision(x - 16, y - 32, 32, 64));
  player.x = x;
  player.y = y;
  player.health = 100;
}
