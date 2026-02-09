import type { CameraInterface, PlayerInterface, PlayerConstructorParams, AnimationFrame } from "./types";

export default class Player implements PlayerInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  gameWidth: number;
  gameHeight: number;
  color: string;
  speed: number;
  radius: number;
  username: string;
  health: number;
  img: HTMLImageElement;
  frames: AnimationFrame[];
  delay: number;
  delayCount: number;
  frameCount: number;
  angle: number;
  target?: { x: number; y: number };

  constructor({
    canvas,
    ctx,
    gameWidth,
    gameHeight,
    x,
    y,
    color,
    speed,
    username,
    radius,
    health,
  }: PlayerConstructorParams) {
    this.width = 40;
    this.height = 40;
    this.ctx = ctx;
    this.canvas = canvas;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.color = color;
    this.x = x;
    this.y = y;
    this.speed = speed || 3;
    this.radius = radius;
    this.username = username;
    this.health = health;
    this.img = new Image();
    this.img.src = "./assets/fPlayer_ [human].png";
    this.width = 32;
    this.height = 64;
    this.frames = [
      { x: 490, y: 75, xx: 10 },
      { x: 458, y: 75, xx: 42 },
      { x: 426, y: 75, xx: 74 },
      { x: 394, y: 75, xx: 106 },
    ];
    this.delay = 10;
    this.delayCount = 0;
    this.frameCount = 0;
    this.angle = 0;
  }

  draw(camera: CameraInterface): void {
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.x - camera.x - this.width / 2,
      this.y - camera.y - this.height / 2 - 14,
      (this.health * this.width) / 100,
      6
    );
    this.ctx.strokeStyle = this.color;
    this.ctx.strokeRect(
      this.x - camera.x - this.width / 2 - 1,
      this.y - camera.y - this.height / 2 - 15,
      this.width + 1,
      8
    );
    this.ctx.font = "16px adrip";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      this.username,
      this.x - camera.x - this.width / 2,
      this.y - camera.y + this.height - 10
    );

    this.delayCount++;
    if (this.delayCount >= this.delay) {
      this.delayCount = 0;
      this.frameCount += 1;
      if (this.frameCount >= this.frames.length) this.frameCount = 0;
    }
    this.ctx.imageSmoothingEnabled = false;

    // Direction left or right
    if (this.angle < Math.PI / 2 && this.angle > -Math.PI / 2) {
      this.ctx.drawImage(
        this.img,
        this.frames[this.frameCount].xx,
        this.frames[this.frameCount].y,
        12,
        18,
        this.x - camera.x - this.width / 2,
        this.y - camera.y - this.height / 2,
        this.width,
        this.height
      );
    } else {
      this.ctx.drawImage(
        this.img,
        this.frames[this.frameCount].x,
        this.frames[this.frameCount].y,
        12,
        18,
        this.x - camera.x - this.width / 2,
        this.y - camera.y - this.height / 2,
        this.width,
        this.height
      );
    }
  }
}
