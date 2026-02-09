// Shared Type Definitions for Multiplayer Game

export interface Velocity {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  color: string;
  sequenceNumber: number;
  score: number;
  username: string;
  health: number;
  angle: number;
  radius: number;
}

export interface Projectile {
  x: number;
  y: number;
  velocity: Velocity;
  playerId: string;
  radius: number;
}

export interface Enemy {
  x: number;
  y: number;
  color: string;
  health: number;
  radius: number;
  velocity: Velocity;
  targetPlayerId: string;
}

// Socket.IO Event Types
export interface ClientToServerEvents {
  mousemove: (data: { angle: number }) => void;
  shoot: (data: { x: number; y: number; angle: number }) => void;
  initGame: (data: { username: string; devicePixelRatio: number }) => void;
  keydown: (data: { keycode: string; sequenceNumber: number }) => void;
  disconnect: (reason: string) => void;
}

export interface ServerToClientEvents {
  map: (data: { map: number[]; map2: number[]; foregroundMap: number[] }) => void;
  updatePlayers: (players: Record<string, Player>) => void;
  updateProjectiles: (projectiles: Record<number, Projectile>) => void;
  updateEnemies: (enemies: Record<number, Enemy>) => void;
  projectileHit: (data: {
    hitPosition: { x: number; y: number };
    velocity: { x: number; y: number };
  }) => void;
}
