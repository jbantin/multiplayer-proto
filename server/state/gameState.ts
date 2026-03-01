// Game State Management
import type { Player, Projectile, Enemy } from "../../types";


// Player State
export const backEndPlayers: Record<string, Player> = {};

// Projectile State
export const backEndProjectiles: Record<number, Projectile> = {};
let projectileIdCounter = 0;

/**
 * Gets the next projectile ID and increments the counter
 */
export function getNextProjectileId(): number {
  projectileIdCounter++;
  return projectileIdCounter;
}

// Enemy State
export const backEndEnemies: Record<number, Enemy> = {};
let enemyIdCounter = 0;

/**
 * Gets the next enemy ID and increments the counter
 */
export function getNextEnemyId(): number {
  enemyIdCounter++;
  return enemyIdCounter;
}
