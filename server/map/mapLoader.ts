// Map Data Loading and Obstacle Setup
import mapData from "../../multiMap.json";
import type { Obstacle } from "../../types";
import { OBSTACLE_WIDTH, OBSTACLE_HEIGHT } from "../config/constants";

// Load map layers from JSON data
export const map = mapData.layers[0].data;
export const map2 = mapData.layers[1].data;
export const foregroundMap = mapData.layers[2].data;

// Export obstacle dimensions for use in collision detection
export const obstacleWidth = OBSTACLE_WIDTH;
export const obstacleHeight = OBSTACLE_HEIGHT;

/**
 * Converts map data into an array of obstacle objects with x, y coordinates
 * @param mapLayer - The map layer data array (32x32 tiles)
 * @returns Array of obstacles with pixel coordinates
 */
function setObstacles(mapLayer: number[]): Obstacle[] {
  const obstacles: Obstacle[] = [];
  for (let i = 0; i < 32 * 32; i++) {
    if (mapLayer[i] !== 0) {
      obstacles.push({
        x: Math.floor((i % 32) * 64),
        y: Math.floor(i / 32) * 64,
      });
    }
  }
  return obstacles;
}

// Initialize obstacles from the collision layer (layer 3)
export const obstacles: Obstacle[] = setObstacles(mapData.layers[3].data);
