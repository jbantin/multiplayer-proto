import Player from "./Player";
import Camera from "./Camera";
import Projectile from "./Projectile";
import Enemy from "./Enemy";
import Particle from "./Particle";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";
import type {
  KeyStates,
  PlayerInput,
  PlayerInterface,
  ProjectileInterface,
  EnemyInterface,
  ParticleInterface,
} from "./types";

export default class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  animationFrameId: number | undefined;
  tileMap: HTMLImageElement;
  map: number[];
  map2: number[];
  foregroundMap: number[];
  gameWindowWidth: number;
  gameWindowHeight: number;
  frontEndPlayers: Record<string, PlayerInterface>;
  frontEndProjectiles: Record<string, ProjectileInterface>;
  particles: ParticleInterface[];
  enemies: Record<string, EnemyInterface>;
  camera: Camera;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  keys: KeyStates;
  sequenceNumber: number;
  lastTime: number;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    gameWindowWidth: number,
    gameWindowHeight: number,
    frontEndPlayers: Record<string, PlayerInterface>,
    socket: Socket<ServerToClientEvents, ClientToServerEvents>,
    playerInputs: PlayerInput[],
    frontEndProjectiles: Record<string, ProjectileInterface>
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = 32 * 64;
    this.height = 32 * 64;
    this.animationFrameId = undefined;
    this.tileMap = new Image();
    this.tileMap.src = "./assets/TilesetGround.png";
    this.map = [];
    this.map2 = [];
    this.foregroundMap = [];
    this.gameWindowWidth = gameWindowWidth;
    this.gameWindowHeight = gameWindowHeight;
    this.frontEndPlayers = frontEndPlayers;
    this.frontEndProjectiles = frontEndProjectiles;
    this.particles = [];
    this.enemies = {};
    this.camera = new Camera(
      this.gameWindowWidth,
      this.gameWindowHeight,
      this.width,
      this.height
    );
    this.socket = socket;
    this.lastTime = 0;

    this.keys = {
      w: { pressed: false },
      a: { pressed: false },
      s: { pressed: false },
      d: { pressed: false },
    };

    document.addEventListener("mousemove", (event: MouseEvent) => {
      if (this.frontEndPlayers[this.socket.id]) {
        this.frontEndPlayers[this.socket.id].angle = this.mouseAngle(event);
        this.socket.emit("mousemove", {
          angle: this.frontEndPlayers[this.socket.id].angle,
        });
      }
    });

    document.addEventListener("click", (event: MouseEvent) => {
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

    const usernameForm = document.querySelector("#usernameForm") as HTMLFormElement;
    const usernameInput = document.querySelector("#usernameInput") as HTMLInputElement;
    const devicePixelRatio = window.devicePixelRatio || 1;

    usernameForm.addEventListener("submit", (event: Event) => {
      event.preventDefault();
      usernameForm.style.display = "none";
      socket.emit("initGame", {
        username: usernameInput.value,
        devicePixelRatio,
      });
    });

    this.sequenceNumber = 0;
    this.init(playerInputs);
  }

  init(playerInputs: PlayerInput[]): void {
    setInterval(() => {
      const currentPlayer = this.frontEndPlayers[this.socket.id];
      if (!currentPlayer) return;

      if (this.keys.w.pressed) {
        this.sequenceNumber++;
        playerInputs.push({
          sequenceNumber: this.sequenceNumber,
          dx: 0,
          dy: -currentPlayer.speed,
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
          dx: -currentPlayer.speed,
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
          dy: currentPlayer.speed,
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
          dx: currentPlayer.speed,
          dy: 0,
        });

        this.socket.emit("keydown", {
          keycode: "KeyD",
          sequenceNumber: this.sequenceNumber,
        });
      }
    }, 15);
  }

  update(currentTime: number): void {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.frontEndPlayers[this.socket.id])
      this.camera.update(this.frontEndPlayers[this.socket.id]);

    this.background(this.map);
    this.background(this.map2);

    for (const id in this.frontEndProjectiles) {
      this.frontEndProjectiles[id].draw(this.camera);
    }

    for (const id in this.frontEndPlayers) {
      const frontEndPlayer = this.frontEndPlayers[id];

      if (frontEndPlayer.target) {
        this.frontEndPlayers[id].x +=
          (this.frontEndPlayers[id].target.x - this.frontEndPlayers[id].x) * 0.5;
        this.frontEndPlayers[id].y +=
          (this.frontEndPlayers[id].target.y - this.frontEndPlayers[id].y) * 0.5;
      }
      this.frontEndPlayers[id].draw(this.camera);
    }
    this.particlesHandler();
    this.enemiesHandler();
    this.background(this.foregroundMap);

    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  enemiesHandler(): void {
    for (const id in this.enemies) {
      const enemy = this.enemies[id];
      if (enemy.health !== undefined && enemy.health <= 0) {
        delete this.enemies[id];
      } else {
        enemy.update(this.camera);
      }
    }
  }

  particlesHandler(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (particle.opacity <= 0) {
        this.particles.splice(i, 1);
      } else {
        particle.update(this.camera);
      }
    }
  }

  background(map: number[]): void {
    this.ctx.imageSmoothingEnabled = false;
    const mapIndexStart =
      Math.floor(this.camera.x / 64) + Math.floor(this.camera.y / 64) * 32;

    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 21; x++) {
        let tile = map[x + y * 32 + mapIndexStart] - 1;
        if (tile === -1) {
          continue;
        }
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

  keyDownHandler(e: KeyboardEvent): void {
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

  keyUpHandler(e: KeyboardEvent): void {
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

  mouseAngle(event: MouseEvent): number {
    if (this.frontEndPlayers[this.socket.id]) {
      const playerPosition = {
        x: this.frontEndPlayers[this.socket.id].x,
        y: this.frontEndPlayers[this.socket.id].y,
      };
      // Calculation of relative player position to camera
      const relativePlayerX = playerPosition.x - this.camera.x;
      const relativePlayerY = playerPosition.y - this.camera.y;

      // Calculation of clicks relative to game window
      const relativeClickX =
        (event.clientX * this.gameWindowWidth) / window.innerWidth;

      const relativeClickY =
        (event.clientY * this.gameWindowHeight) / window.innerHeight;

      // Calculation of angle
      const angle = Math.atan2(
        relativeClickY - relativePlayerY,
        relativeClickX - relativePlayerX
      );
      return angle;
    }
    return 0;
  }
}
