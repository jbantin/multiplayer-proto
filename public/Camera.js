export default class Camera {
  constructor(gameWindowWidth, gameWidowHeight, gameWidth, gameHeight) {
    this.x;
    this.y;
    this.gameWindowWidth = gameWindowWidth;
    this.gameWindowHeight = gameWidowHeight;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }
  update(player) {
    // console.log(player);
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
