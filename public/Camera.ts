import type { CameraInterface, PlayerInterface } from "./types";

export default class Camera implements CameraInterface {
  x: number;
  y: number;
  gameWindowWidth: number;
  gameWindowHeight: number;
  gameWidth: number;
  gameHeight: number;

  constructor(
    gameWindowWidth: number,
    gameWindowHeight: number,
    gameWidth: number,
    gameHeight: number
  ) {
    this.x = 0;
    this.y = 0;
    this.gameWindowWidth = gameWindowWidth;
    this.gameWindowHeight = gameWindowHeight;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }

  update(player: PlayerInterface): void {
    this.x = player.x - this.gameWindowWidth / 2;
    if (this.x < 0) this.x = 0;
    if (this.x > this.gameWidth - this.gameWindowWidth)
      this.x = this.gameWidth - this.gameWindowWidth;
    
    this.y = player.y - this.gameWindowHeight / 2;
    if (this.y < 0) this.y = 0;
    if (this.y > this.gameHeight - this.gameWindowHeight)
      this.y = this.gameHeight - this.gameWindowHeight;
  }
}
