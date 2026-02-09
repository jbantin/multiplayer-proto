import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import Game from "./Game";
import Player from "./Player";
import Projectile from "./Projectile";
import Particle from "./Particle";
import Enemy from "./Enemy";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";
import type { PlayerInput, PlayerInterface, ProjectileInterface } from "./types";

const canvas = document.querySelector("#myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const devicePixelRatio = window.devicePixelRatio || 1;

const gameWindowWidth = 1280;
const gameWindowHeight = 800;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
const playerInputs: PlayerInput[] = [];
const frontEndPlayers: Record<string, PlayerInterface> = {};
const frontEndProjectiles: Record<string, ProjectileInterface> = {};

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("updateEnemies", (backEndEnemies) => {
  for (const id in backEndEnemies) {
    const backEndEnemy = backEndEnemies[id];
    if (!game.enemies[id]) {
      game.enemies[id] = new Enemy({
        x: backEndEnemy.x,
        y: backEndEnemy.y,
        radius: backEndEnemy.radius,
        color: "red",
        velocity: backEndEnemy.velocity,
        ctx,
      });
    } else {
      // Update position using server data
      game.enemies[id].x = backEndEnemy.x;
      game.enemies[id].y = backEndEnemy.y;
      game.enemies[id].velocity = backEndEnemy.velocity;
    }
  }
  // Remove enemies that no longer exist on the server
  for (const id in game.enemies) {
    if (!backEndEnemies[id]) {
      delete game.enemies[id];
    }
  }
});

socket.on("updateProjectiles", (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id];
    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: backEndProjectile.radius,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity,
        ctx,
      });
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y;
    }
  }
  for (const frontEndProjectileId in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectileId]) {
      delete frontEndProjectiles[frontEndProjectileId];
    }
  }
});

socket.on("updatePlayers", (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        canvas: canvas,
        ctx: ctx,
        gameWidth: 2048,
        gameHeight: 2048,
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        color: backEndPlayer.color,
        username: backEndPlayer.username,
        radius: backEndPlayer.radius,
        health: backEndPlayer.health,
      });

      const playerLabels = document.querySelector("#playerLabels") as HTMLElement;
      playerLabels.innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">Player ${backEndPlayer.username}: ${backEndPlayer.score}</div>`;
    } else {
      const playerDiv = document.querySelector(`div[data-id="${id}"]`) as HTMLElement;
      if (playerDiv) {
        playerDiv.innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`;
        playerDiv.setAttribute("data-score", backEndPlayer.score.toString());
      }

      // Sort the player divs
      const parentDiv = document.querySelector("#playerLabels") as HTMLElement;
      const childDivs = Array.from(parentDiv.querySelectorAll("div")) as HTMLElement[];

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute("data-score"));
        const scoreB = Number(b.getAttribute("data-score"));
        return scoreB - scoreA;
      });
      // Remove old elements
      childDivs.forEach((div) => {
        parentDiv.removeChild(div);
      });
      // Add sorted elements
      childDivs.forEach((div) => {
        parentDiv.appendChild(div);
      });

      // Update player health
      frontEndPlayers[id].health = backEndPlayer.health;

      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y,
      };

      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber;
        });

        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1);
        playerInputs.forEach((input) => {
          if (frontEndPlayers[id].target) {
            frontEndPlayers[id].target!.x += input.dx;
            frontEndPlayers[id].target!.y += input.dy;
          }
        });
      }
    }
    // Update angle
    frontEndPlayers[id].angle = backEndPlayer.angle;
  }

  // Delete frontend players
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`) as HTMLElement;
      if (divToDelete && divToDelete.parentNode) {
        divToDelete.parentNode.removeChild(divToDelete);
      }

      if (id === socket.id) {
        const usernameForm = document.querySelector("#usernameForm") as HTMLElement;
        usernameForm.style.display = "block";
      }

      delete frontEndPlayers[id];
    }
  }
});

socket.on("projectileHit", ({ hitPosition, velocity }) => {
  for (let i = 0; i < 40; i++) {
    const particle = new Particle({
      x: hitPosition.x,
      y: hitPosition.y,
      radius: 3,
      color: "darkred",
      velocity: {
        x: (Math.random() - 0.5) * 2 + velocity.x * 0.15,
        y: (Math.random() - 0.5) * 2 + velocity.y * 0.15,
      },
      ctx: ctx,
      fades: true,
      opacity: Math.random() + 0.5,
    });
    game.particles.push(particle);
  }
});

window.addEventListener("resize", resizeHandler);

resizeHandler();

function resizeHandler(): void {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.scale(
    (window.innerWidth / gameWindowWidth) * devicePixelRatio,
    (window.innerHeight / gameWindowHeight) * devicePixelRatio
  );
}

const game = new Game(
  canvas,
  ctx,
  gameWindowWidth,
  gameWindowHeight,
  frontEndPlayers,
  socket,
  playerInputs,
  frontEndProjectiles
);

socket.on("map", ({ map, map2, foregroundMap }) => {
  game.map = map;
  game.map2 = map2;
  game.foregroundMap = foregroundMap;
});

game.update(0);
