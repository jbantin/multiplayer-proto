// Collision Detection Functions
import { obstacles, obstacleWidth, obstacleHeight } from "../map/mapLoader";

/**
 * Checks if a rectangle collides with any obstacles on the map
 * @param x - X coordinate of the rectangle's top-left corner
 * @param y - Y coordinate of the rectangle's top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns true if collision detected, false otherwise
 */
export function obstacleCollision(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
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
