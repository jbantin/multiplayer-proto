// Game State Management
import type { Player, Projectile, Enemy } from "../../types";
import { ENEMY_TARGET_RETARGET_INTERVAL } from "../config/constants";

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

// Initialize one enemy on startup
const initialEnemyId = getNextEnemyId();
backEndEnemies[initialEnemyId] = {
  x: 500,
  y: 500,
  color: "red",
  health: 100,
  radius: 15,
  velocity: { x: 0, y: 10 },
  targetPlayerId: "",
  targetTimer: ENEMY_TARGET_RETARGET_INTERVAL
};
