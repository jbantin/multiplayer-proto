import type { Velocity } from "../types";
import type { CameraInterface, EnemyInterface, EnemyConstructorParams } from "./types";

export default class Enemy implements EnemyInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  health?: number;

  constructor({ x, y, radius, color = "red", velocity, ctx }: EnemyConstructorParams) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
  }

  draw(camera: CameraInterface): void {
    this.ctx.beginPath();
    this.ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  update(camera: CameraInterface): void {
    this.draw(camera);
  }
}
