export default class Projectile {
  constructor({ x, y, radius, color = "white", velocity, ctx }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.ctx = ctx;
  }
  draw(camera) {
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

  update(camera) {
    console.log("huhu");
    this.draw(camera);
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}
