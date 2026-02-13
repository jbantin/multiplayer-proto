import { Enemy, Player } from "../../types";
import { ENEMY_TARGET_RETARGET_INTERVAL } from "../config/constants";
import { backEndPlayers } from "../state/gameState";

export function moveEnemyTowardsPlayer(enemy: Enemy, speed: number = 2) {
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
    enemy.x += (dx / distance) * speed;
    enemy.y += (dy / distance) * speed;
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
