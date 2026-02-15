// Game Loop - Handles periodic game state updates
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../../types";
import {
  backEndPlayers,
  backEndProjectiles,
  backEndEnemies,
} from "../state/gameState";
import { GAMEWIDTH, GAMEHEIGHT, PROJECTILE_RADIUS } from "../config/constants";
import { obstacleCollision } from "./collision";
import { resetPlayer } from "../utils/playerUtils";
import { updateEnemy } from "../entities/enemyService";

/**
 * Starts the game loop that updates game state at fixed intervals
 * @param io - The Socket.IO server instance for emitting updates
 */
export function startGameLoop(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  setInterval(() => {
    // Update enemy positions
    for (const enemyIdKey in backEndEnemies) {
      const enemy = backEndEnemies[enemyIdKey];      
      updateEnemy(enemy);      
    } 
    
    // Update projectile positions and check collisions
    for (const id in backEndProjectiles) {
      const projectile = backEndProjectiles[id];
      projectile.x += projectile.velocity.x;
      projectile.y += projectile.velocity.y;

      // Check collision with obstacles
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

      // Check if projectile is out of bounds
      if (
        projectile.x + PROJECTILE_RADIUS < 0 ||
        projectile.x - PROJECTILE_RADIUS > GAMEWIDTH ||
        projectile.y + PROJECTILE_RADIUS < 0 ||
        projectile.y - PROJECTILE_RADIUS > GAMEHEIGHT
      ) {
        delete backEndProjectiles[id];
        continue;
      }

      // Check collision with players
      for (const playerId in backEndPlayers) {
        const backEndPlayer = backEndPlayers[playerId];

        const DISTANCE = Math.hypot(
          projectile.x - backEndPlayer.x,
          projectile.y - backEndPlayer.y
        );

        // Collision detection: projectile hit a player
        if (
          DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
          projectile.playerId !== playerId
        ) {
          backEndPlayer.health -= 20;
          
          // Player died
          if (backEndPlayer.health <= 0) {
            resetPlayer(backEndPlayer);
            const shooter = backEndPlayers[projectile.playerId];
            if (shooter) {
              shooter.score += 1;
            }
          }
          
          // Emit projectile hit event for visual effects
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

    // Emit updated game state to all clients
    io.emit("updateProjectiles", backEndProjectiles);
    io.emit("updatePlayers", backEndPlayers);
    io.emit("updateEnemies", backEndEnemies);
  }, 15); // Run game loop every 15ms (~66.6 FPS)
}
