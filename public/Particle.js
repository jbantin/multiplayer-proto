export default class Particle {
  constructor({ x, y, radius, color = "white", velocity, ctx, fades, opacity = 1 }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
    this.opacity = opacity;
    this.fades = fades;
  }
  draw(camera) {
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      this.x - camera.x - this.radius,
      this.y - camera.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
    this.ctx.restore();
  }

  update(camera) {
    this.draw(camera);
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
    if (this.fades) this.opacity -= 0.0050;
    }
}