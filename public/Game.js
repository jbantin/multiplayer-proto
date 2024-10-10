import Player from "./Player.js";
import Camera from "./Camera.js";
import Projectile from "./Projectile.js";
export default class Game {
  constructor(
    canvas,
    ctx,
    gameWindowWidth,
    gameWindowHeight,
    frontEndPlayers,
    socket,
    playerInputs,
    frontEndProjectiles
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = 32 * 64;
    this.height = 32 * 64;
    this.animationFrameId = undefined;
    this.tileMap = new Image();
    this.tileMap.src = "./assets/TilesetGround.png";
    this.map = [];
    this.gameWindowWidth = gameWindowWidth;
    this.gameWindowHeight = gameWindowHeight;
    this.frontEndPlayers = frontEndPlayers;
    this.frontEndProjectiles = frontEndProjectiles;
    this.camera = new Camera(
      this.gameWindowWidth,
      this.gameWindowHeight,
      this.width,
      this.height
    );
    // console.log(this.map);
    this.socket = socket;

    this.keys = {
      w: { pressed: false },
      a: { pressed: false },
      s: { pressed: false },
      d: { pressed: false },
    };

    document.addEventListener("mousemove", (event) => {
      if (this.frontEndPlayers[this.socket.id]) {
        this.frontEndPlayers[this.socket.id].angle = this.mouseAngle(event);
        this.socket.emit("mousemove", {
          angle: this.frontEndPlayers[this.socket.id].angle,
        });
      }
    });
    //projectiles on click;

    document.addEventListener("click", (event) => {
      if (this.frontEndPlayers[this.socket.id]) {
        const playerPosition = {
          x: this.frontEndPlayers[this.socket.id].x,
          y: this.frontEndPlayers[this.socket.id].y,
        };

        const angle = this.mouseAngle(event);

        socket.emit("shoot", {
          x: playerPosition.x,
          y: playerPosition.y,
          angle,
        });
      }
    });

    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
    document.addEventListener("keydown", this.keyDownHandler);
    document.addEventListener("keyup", this.keyUpHandler);

    document
      .querySelector("#usernameForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        document.querySelector("#usernameForm").style.display = "none";
        socket.emit("initGame", {
          username: document.querySelector("#usernameInput").value,
          devicePixelRatio,
        });
      });

    this.sequenceNumber = 0;
    this.init(playerInputs);
  }
  init(playerInputs) {
    setInterval(() => {
      if (this.keys.w.pressed) {
        this.sequenceNumber++;
        playerInputs.push({
          sequenceNumber: this.sequenceNumber,
          dx: 0,
          dy: -this.frontEndPlayers[this.socket.id].speed,
        });

        this.socket.emit("keydown", {
          keycode: "KeyW",
          sequenceNumber: this.sequenceNumber,
        });
      }
      if (this.keys.a.pressed) {
        this.sequenceNumber++;
        playerInputs.push({
          sequenceNumber: this.sequenceNumber,
          dx: -this.frontEndPlayers[this.socket.id].speed,
          dy: 0,
        });

        this.socket.emit("keydown", {
          keycode: "KeyA",
          sequenceNumber: this.sequenceNumber,
        });
      }
      if (this.keys.s.pressed) {
        this.sequenceNumber++;
        playerInputs.push({
          sequenceNumber: this.sequenceNumber,
          dx: 0,
          dy: this.frontEndPlayers[this.socket.id].speed,
        });

        this.socket.emit("keydown", {
          keycode: "KeyS",
          sequenceNumber: this.sequenceNumber,
        });
      }
      if (this.keys.d.pressed) {
        this.sequenceNumber++;
        playerInputs.push({
          sequenceNumber: this.sequenceNumber,
          dx: this.frontEndPlayers[this.socket.id].speed,
          dy: 0,
        });

        this.socket.emit("keydown", {
          keycode: "KeyD",
          sequenceNumber: this.sequenceNumber,
        });
      }
    }, 15);
  }
  update(currentTime) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.frontEndPlayers[this.socket.id])
      this.camera.update(this.frontEndPlayers[this.socket.id]);

    this.background();

    for (const id in this.frontEndProjectiles) {
      this.frontEndProjectiles[id].draw(this.camera);
    }

    for (const id in this.frontEndPlayers) {
      const frontEndPlayer = this.frontEndPlayers[id];

      if (frontEndPlayer.target) {
        this.frontEndPlayers[id].x +=
          (this.frontEndPlayers[id].target.x - this.frontEndPlayers[id].x) *
          0.5;
        this.frontEndPlayers[id].y +=
          (this.frontEndPlayers[id].target.y - this.frontEndPlayers[id].y) *
          0.5;
      }
      this.frontEndPlayers[id].draw(this.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }
  background() {
    this.ctx.imageSmoothingEnabled = false;
    const mapIndexStart =
      Math.floor(this.camera.x / 64) + Math.floor(this.camera.y / 64) * 32;
    console.log(mapIndexStart);
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 21; x++) {
        let tile = this.map[x + y * 32 + mapIndexStart] - 1;
        this.ctx.drawImage(
          this.tileMap,

          (tile % 16) * 32,
          Math.floor(tile / 16) * 32,
          32,
          32,
          x * 64 - (this.camera.x % 64),
          y * 64 - (this.camera.y % 64),
          64,
          64
        );
      }
    }
  }

  keyDownHandler(e) {
    if (!this.frontEndPlayers[this.socket.id]) return;
    if (e.code === "KeyW") {
      this.keys.w.pressed = true;
    }
    if (e.code === "KeyS") {
      this.keys.s.pressed = true;
    }
    if (e.code === "KeyA") {
      this.keys.a.pressed = true;
    }
    if (e.code === "KeyD") {
      this.keys.d.pressed = true;
    }
  }
  keyUpHandler(e) {
    if (e.code === "KeyW") {
      this.keys.w.pressed = false;
    }
    if (e.code === "KeyS") {
      this.keys.s.pressed = false;
    }
    if (e.code === "KeyA") {
      this.keys.a.pressed = false;
    }
    if (e.code === "KeyD") {
      this.keys.d.pressed = false;
    }
  }
  mouseAngle(event) {
    if (this.frontEndPlayers[this.socket.id]) {
      const playerPosition = {
        x: this.frontEndPlayers[this.socket.id].x,
        y: this.frontEndPlayers[this.socket.id].y,
      };
      // Berechnung der relativen Position des Spielers zur Kamera
      const relativePlayerX = playerPosition.x - this.camera.x;
      const relativePlayerY = playerPosition.y - this.camera.y;

      // Berechnung der Klicks relativ zum gamewindow
      const relativeClickX =
        (event.clientX * this.gameWindowWidth) / window.innerWidth;

      const relativeClickY =
        (event.clientY * this.gameWindowHeight) / window.innerHeight;

      // Berechnung des Winkels
      const angle = Math.atan2(
        relativeClickY - relativePlayerY,
        relativeClickX - relativePlayerX
      );
      return angle;
    }
  }
}
