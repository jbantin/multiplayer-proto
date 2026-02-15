import { Enemy, Player } from "../../types";
import { ENEMY_TARGET_RETARGET_INTERVAL } from "../config/constants";
import { obstacleCollision } from "../game/collision";
import { backEndPlayers, backEndProjectiles } from "../state/gameState";


export function updateEnemy(enemy: Enemy): void {
  moveEnemyTowardsPlayer(enemy);
  shootAtPlayer(enemy);
  
}
function shootAtPlayer(enemy: Enemy): void {
  enemy.shootTimer--;
  if (!enemy.targetPlayerId || !backEndPlayers[enemy.targetPlayerId ] || enemy.shootTimer > 0) {
    return; // No target available, exit the function
  }
  enemy.shootTimer = 60; // Reset shoot timer to prevent continuous shooting
  const targetPlayer = backEndPlayers[enemy.targetPlayerId];
  const dx = targetPlayer.x - enemy.x;
  const dy = targetPlayer.y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const velocity = {
    x: (dx / distance) * 8,
    y: (dy / distance) * 8,
  };
  backEndProjectiles[Date.now()] = {
    x: enemy.x,
    y: enemy.y,
    velocity,
    playerId: "npc",
    radius: 4,
    };  
}
function moveEnemyTowardsPlayer(enemy: Enemy, speed: number = 2) {
  enemy.targetTimer--;
  if (!enemy.targetPlayerId || !backEndPlayers[enemy.targetPlayerId] || enemy.targetTimer <= 0) {
    setTarget(enemy, backEndPlayers);
    enemy.targetTimer = ENEMY_TARGET_RETARGET_INTERVAL;
  }

  if (!enemy.targetPlayerId || !backEndPlayers[enemy.targetPlayerId]) {
    return; // No target available, exit the function
  }

  const dx = backEndPlayers[enemy.targetPlayerId].x - enemy.x;
  const dy = backEndPlayers[enemy.targetPlayerId].y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 0) {
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;
    enemy.x += vx;
    if (obstacleCollision(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2)) {
      enemy.x -= vx; // Revert X movement if it collides with an obstacle
    }
    enemy.y += vy;
    if (obstacleCollision(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2)) {
      enemy.y -= vy; // Revert Y movement if it collides with an obstacle
    }
  } else {
    // Enemy is already at the player's position, do nothing
  }
}

export function setTarget(enemy: Enemy, players: Record<string, Player>) {
  const playerIds = Object.keys(players);
  if (playerIds.length === 0) {
    enemy.targetPlayerId = ""; // No players available, set target to null
    return null;
  }
  
  let nearestPlayerId = playerIds[0];
  let minDistance = Infinity;

  for (const playerId of playerIds) {
    const player = players[playerId];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPlayerId = playerId;
    }
  }

  enemy.targetPlayerId = nearestPlayerId;
  return;
}
