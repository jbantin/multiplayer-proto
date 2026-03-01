import { GAMEHEIGHT, GAMEWIDTH } from "../config/constants";
import { backEndEnemies } from "../state/gameState";
import { ENEMY_SHOOT_INTERVAL, ENEMY_TARGET_RETARGET_INTERVAL } from "../config/constants";

export function addEnemy() {
  const enemyId = Date.now(); // Unique ID based on timestamp
  backEndEnemies[enemyId] = {
    x: Math.random() * GAMEWIDTH,
    y: Math.random() * GAMEHEIGHT,
    color: "red",
    health: 40,
    velocity: { x: 0, y: 0 },
    targetPlayerId: "",
    targetTimer: ENEMY_TARGET_RETARGET_INTERVAL,
    shootTimer: ENEMY_SHOOT_INTERVAL,
    radius: 15,
  };
}