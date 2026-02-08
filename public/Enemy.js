export default class Enemy {
  constructor({ x, y, radius, color = "red", velocity, ctx }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
  }
  draw(camera) {
    this.ctx.beginPath();
    this.ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  update(camera) {
    this.draw(camera);
  }
}