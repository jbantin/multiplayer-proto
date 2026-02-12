// Player Utility Functions
import type { Player } from "../../types";
import { GAMEWIDTH, GAMEHEIGHT } from "../config/constants";
import { obstacleCollision } from "../game/collision";

/**
 * Resets a player's position and health after death
 * Finds a random spawn position that doesn't collide with obstacles
 * @param player - The player object to reset
 */
export function resetPlayer(player: Player): void {
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
