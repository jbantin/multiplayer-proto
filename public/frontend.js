import Game from "./Game.js";
import Player from "./Player.js";
import Projectile from "./Projectile.js";

const canvas = document.querySelector("#myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const devicePixelRatio = window.devicePixelRatio || 1;

const gameWindowWidth = 1280;
const gameWindowHeight = 800;
let map = undefined;
const socket = io();
const playerInputs = [];
const frontEndPlayers = {};
const frontEndProjectiles = {};

socket.on("connect", () => {
  socket.emit("initCanvas", {
    devicePixelRatio,
  });
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
  // console.log(frontEndProjectiles);
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

      document.querySelector(
        "#playerLabels"
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">Player ${backEndPlayer.username}: ${backEndPlayer.score}</div>`;
    } else {
      document.querySelector(
        `div[data-id="${id}"]`
      ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`;

      document
        .querySelector(`div[data-id="${id}"]`)
        .setAttribute("data-score", backEndPlayer.score);
      //sorts the players divs
      const parentDiv = document.querySelector("#playerLabels");
      const childDivs = Array.from(parentDiv.querySelectorAll("div"));

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute("data-score"));
        const scoreB = Number(b.getAttribute("data-score"));
        return scoreB - scoreA;
      });
      // removes old elements
      childDivs.forEach((div) => {
        parentDiv.removeChild(div);
      });
      //add sorted elements
      childDivs.forEach((div) => {
        parentDiv.appendChild(div);
      });

      //update playerHealth
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
          frontEndPlayers[id].target.x += input.dx;
          frontEndPlayers[id].target.y += input.dy;
        });
      }
    }
    //update angle
    frontEndPlayers[id].angle = backEndPlayer.angle;
  }

  //delete frontend players
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`);
      divToDelete.parentNode.removeChild(divToDelete);

      if (id === socket.id) {
        document.querySelector("#usernameForm").style.display = "block";
      }

      delete frontEndPlayers[id];
    }
  }
});

window.addEventListener("resize", resizeHandler);

resizeHandler();

function resizeHandler(e) {
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
socket.on("map", (map) => {
  game.map = map;
  // console.log(map);
});
game.update(0);
