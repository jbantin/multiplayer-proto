import type { Velocity } from "../types";
import type { CameraInterface, ProjectileInterface, ProjectileConstructorParams } from "./types";

export default class Projectile implements ProjectileInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;

  constructor({ x, y, radius, color = "orange", velocity, ctx }: ProjectileConstructorParams) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
  }

  draw(camera: CameraInterface): void {
    this.ctx.beginPath();
    this.ctx.arc(
      this.x - camera.x,
      this.y - camera.y,
      this.radius,
      0,
      Math.PI * 2,
      false
    );
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  update(camera: CameraInterface): void {
    this.draw(camera);
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}
