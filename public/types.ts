// Frontend-specific type definitions
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, Velocity } from "../types";

// Camera types
export interface CameraInterface {
  x: number;
  y: number;
  gameWindowWidth: number;
  gameWindowHeight: number;
  gameWidth: number;
  gameHeight: number;
}

// Constructor parameter interfaces
export interface CameraConstructorParams {
  gameWindowWidth: number;
  gameWindowHeight: number;
  gameWidth: number;
  gameHeight: number;
}

export interface ParticleConstructorParams {
  x: number;
  y: number;
  radius: number;
  color?: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  fades: boolean;
  opacity?: number;
}

export interface ProjectileConstructorParams {
  x: number;
  y: number;
  radius: number;
  color?: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
}

export interface EnemyConstructorParams {
  x: number;
  y: number;
  radius: number;
  color?: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
}

export interface PlayerConstructorParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gameWidth: number;
  gameHeight: number;
  x: number;
  y: number;
  color: string;
  speed?: number;
  username: string;
  radius: number;
  health: number;
}

export interface GameConstructorParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gameWindowWidth: number;
  gameWindowHeight: number;
  frontEndPlayers: Record<string, PlayerInterface>;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  playerInputs: PlayerInput[];
  frontEndProjectiles: Record<string, ProjectileInterface>;
}

// Game state types
export interface KeyState {
  pressed: boolean;
}

export interface KeyStates {
  w: KeyState;
  a: KeyState;
  s: KeyState;
  d: KeyState;
}

export interface PlayerInput {
  sequenceNumber: number;
  dx: number;
  dy: number;
}

export interface AnimationFrame {
  x: number;
  y: number;
  xx: number;
}

// Extended interfaces for frontend classes
export interface PlayerInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed: number;
  radius: number;
  username: string;
  health: number;
  angle: number;
  target?: { x: number; y: number };
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  gameWidth: number;
  gameHeight: number;
  img: HTMLImageElement;
  frames: AnimationFrame[];
  delay: number;
  delayCount: number;
  frameCount: number;
  draw(camera: CameraInterface): void;
}

export interface ProjectileInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  draw(camera: CameraInterface): void;
  update(camera: CameraInterface): void;
}

export interface EnemyInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  health?: number;
  draw(camera: CameraInterface): void;
  update(camera: CameraInterface): void;
}

export interface ParticleInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  opacity: number;
  fades: boolean;
  draw(camera: CameraInterface): void;
  update(camera: CameraInterface): void;
}
