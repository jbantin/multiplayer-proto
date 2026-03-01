// Game Loop - Handles periodic game state updates
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../../types";
import {
  backEndPlayers,
  backEndProjectiles,
  backEndEnemies,
} from "../state/gameState";
import { GAMEWIDTH, GAMEHEIGHT, PROJECTILE_RADIUS, ENEMY_SPAWN_INTERVAL, PROJECTILE_DAMAGE } from "../config/constants";
import { obstacleCollision } from "./collision";
import { resetPlayer } from "../utils/playerUtils";
import { updateEnemy } from "../entities/enemyService";
import { addEnemy } from "../entities/enemiesHandler";

// Enemy spawn timer (starts at 0 to spawn first enemy immediately)
let enemySpawnTimer = 0;

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
    
    // Add new enemies with spawn delay (max 5 enemies)
    if (Object.keys(backEndEnemies).length < 5) {
      enemySpawnTimer--;
      if (enemySpawnTimer <= 0) {
        addEnemy();
        enemySpawnTimer = ENEMY_SPAWN_INTERVAL; // Reset to ~2 seconds
      }
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
          backEndPlayer.health -= PROJECTILE_DAMAGE;
          
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

      // Check collision with enemies (player projectiles only)
      if (projectile.playerId !== "npc") {
        for (const enemyId in backEndEnemies) {
          const enemy = backEndEnemies[enemyId];
          
          const DISTANCE = Math.hypot(
            projectile.x - enemy.x,
            projectile.y - enemy.y
          );
          
          // Collision detection: projectile hit an enemy
          if (DISTANCE < PROJECTILE_RADIUS + enemy.radius) {
            enemy.health -= PROJECTILE_DAMAGE;
            
            // Award score to shooter for hitting enemy
            const shooter = backEndPlayers[projectile.playerId];
            if (shooter) {
              shooter.score += 1;
            }
            
            // Enemy died
            if (enemy.health <= 0) {
              delete backEndEnemies[enemyId];
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
    }

    // Emit updated game state to all clients
    io.emit("updateProjectiles", backEndProjectiles);
    io.emit("updatePlayers", backEndPlayers);
    io.emit("updateEnemies", backEndEnemies);
  }, 15); // Run game loop every 15ms (~66.6 FPS)
}
