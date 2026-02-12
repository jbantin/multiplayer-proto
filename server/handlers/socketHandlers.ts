// Socket.IO Event Handlers
import { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, Velocity } from "../../types";
import { backEndPlayers, backEndProjectiles, getNextProjectileId } from "../state/gameState";
import { map, map2, foregroundMap } from "../map/mapLoader";
import { GAMEWIDTH, GAMEHEIGHT, SPEED, RADIUS, PROJECTILE_RADIUS } from "../config/constants";
import { obstacleCollision } from "../game/collision";

/**
 * Sets up all Socket.IO connection and event handlers
 * @param io - The Socket.IO server instance
 */
export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log("a user connected");
    
    // Send initial map and player data to the connected client
    io.emit("map", { map, map2, foregroundMap });
    io.emit("updatePlayers", backEndPlayers);

    // Handle mouse movement (player rotation)
    socket.on("mousemove", ({ angle }: { angle: number }) => {
      const player = backEndPlayers[socket.id];
      if (player) {
        player.angle = angle;
      }
    });

    // Handle shooting
    socket.on("shoot", ({ x, y, angle }: { x: number; y: number; angle: number }) => {
      const projectileId = getNextProjectileId();
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

    // Handle game initialization for a new player
    socket.on("initGame", ({ username, devicePixelRatio }: { username: string; devicePixelRatio: number }) => {
      let x = 0;
      let y = 0;
      
      // Find a spawn position that doesn't collide with obstacles
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

    // Handle player disconnect
    socket.on("disconnect", (reason: string) => {
      console.log(reason);
      delete backEndPlayers[socket.id];
      io.emit("updatePlayers", backEndPlayers);
    });

    // Handle player movement (WASD keys)
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
}
