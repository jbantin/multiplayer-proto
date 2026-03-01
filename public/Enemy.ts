import type { Velocity, } from "../types";
import type { AnimationFrame } from "./types";
import type {
  CameraInterface,
  EnemyInterface,
  EnemyConstructorParams,
} from "./types";

export default class Enemy implements EnemyInterface {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: Velocity;
  ctx: CanvasRenderingContext2D;
  health?: number;
  img: HTMLImageElement;
  frames: AnimationFrame[];
  frameCount: number;
  delay: number;
  delayCount: number;

  constructor({
    x,
    y,
    radius,
    color = "red",
    velocity,
    ctx,
  }: EnemyConstructorParams) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
    this.img = new Image();
    this.img.src = "./assets/slime_purple.png";
    this.frames = [
      { x: 5, y: 33, xx: 5 },
      { x: 30, y: 33, xx: 30 },
      { x: 55, y: 33, xx: 55 },
      { x: 80, y: 33, xx: 80 },
    ];
    this.frameCount = 0;
    this.delay = 20;
    this.delayCount = 0;
  }

  draw(camera: CameraInterface): void {
    this.ctx.beginPath();
    this.ctx.arc(
      this.x - camera.x,
      this.y - camera.y,
      this.radius,
      0,
      Math.PI * 2,
    );
    this.ctx.drawImage(
      this.img,
      this.frames[this.frameCount].x,
      this.frames[this.frameCount].y,
      14,
      14,
      this.x - camera.x - this.radius,
      this.y - camera.y - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
  }

  update(camera: CameraInterface): void {
    this.delayCount++;
    if (this.delayCount >= this.delay) {
      this.frameCount = (this.frameCount + 1) % this.frames.length;
      this.delayCount = 0;
    }
    this.draw(camera);
  }
}
