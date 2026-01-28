const express = require("express");
const app = express();

const mapData = require("./multiMap.json");
const map = mapData.layers[0].data;
const map2 = mapData.layers[1].data;
const foregroundMap = mapData.layers[2].data;
const obstacles = setObstacles(mapData.layers[3].data);
const obstacleWidth = 64;
const obstacleHeight = 64;
console.log(obstacles);
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

const port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const backEndPlayers = {};
const backEndProjectiles = {};
const GAMEWIDTH = 32 * 64;
const GAMEHEIGHT = 32 * 64;
const SPEED = 3;
const RADIUS = 15;
const PROJECTILE_RADIUS = 4;
let projectileId = 0;
io.on("connection", (socket) => {
  console.log("a user connected");
  io.emit("map", { map, map2, foregroundMap });
  io.emit("updatePlayers", backEndPlayers);

  socket.on("mousemove", ({ angle }) => {
    backEndPlayers[socket.id].angle = angle;
  });

  socket.on("shoot", ({ x, y, angle }) => {
    projectileId++;
    const velocity = {
      x: Math.cos(angle) * 8,
      y: Math.sin(angle) * 8,
    };
    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id,
      radius: PROJECTILE_RADIUS,
    };
  });
  socket.on("initGame", ({ username, devicePixelRatio }) => {
    let x = 0;
    let y = 0;
    do {
      x = (GAMEWIDTH - 256) * Math.random() + 128;
      y = (GAMEHEIGHT - 256) * Math.random() + 128;
    } while (obstacleCollision(x - 16, y - 32, 32, 64));

    backEndPlayers[socket.id] = {
      x,
      y,
      color: `hsl(${255 * Math.random()},100%,50%)`,
      sequenceNumber: 0,
      score: 0,
      username,
      health: 100,
      angle: 0,
    };
    backEndPlayers[socket.id].radius = RADIUS;
  });
  socket.on("disconnect", (reason) => {
    console.log(reason);
    delete backEndPlayers[socket.id];
    io.emit("updatePlayers", backEndPlayers);
  });

  socket.on("keydown", ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id];

    // if (!backEndPlayer[socket.id]) return;

    backEndPlayers[socket.id].sequenceNumber = sequenceNumber;
    switch (keycode) {
      case "KeyA":
        backEndPlayer.x -= SPEED;
        if (backEndPlayer.x - backEndPlayer.radius < 64)
          backEndPlayer.x = backEndPlayer.radius + 64;
        if (
          obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)
        )
          backEndPlayer.x += SPEED;
        break;
      case "KeyW":
        backEndPlayer.y -= SPEED;
        if (backEndPlayer.y - backEndPlayer.radius < 96)
          backEndPlayer.y = backEndPlayer.radius + 96;
        if (
          obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)
        )
          backEndPlayer.y += SPEED;
        break;
      case "KeyS":
        backEndPlayer.y += SPEED;
        if (backEndPlayer.y + backEndPlayer.radius > GAMEHEIGHT - 64)
          backEndPlayer.y = GAMEHEIGHT - backEndPlayer.radius - 64;
        if (
          obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)
        )
          backEndPlayer.y -= SPEED;
        break;
      case "KeyD":
        backEndPlayer.x += SPEED;
        if (backEndPlayer.x + backEndPlayer.radius > GAMEWIDTH - 64)
          backEndPlayer.x = GAMEWIDTH - backEndPlayer.radius - 64;
        if (
          obstacleCollision(backEndPlayer.x - 16, backEndPlayer.y - 32, 32, 64)
        )
          backEndPlayer.x -= SPEED;
        break;
    }
  });
});
//backend ticker
setInterval(() => {
  //update projectile positions
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y;
    if (
      obstacleCollision(
        backEndProjectiles[id].x,
        backEndProjectiles[id].y,
        PROJECTILE_RADIUS * 2,
        PROJECTILE_RADIUS * 2
      )
    ) {
      delete backEndProjectiles[id];
      continue;
    }
    if (
      backEndProjectiles[id].x + PROJECTILE_RADIUS < 0 ||
      backEndProjectiles[id].x - PROJECTILE_RADIUS > GAMEWIDTH ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS < 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS > GAMEHEIGHT
    ) {
      delete backEndProjectiles[id];
      continue;
    }
    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId];

      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      );

      //collision detection
      if (
        DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        backEndPlayers[playerId].health -= 20;
        if (backEndPlayers[playerId].health <= 0) {
          resetPlayer(backEndPlayers[playerId]);
          if (backEndPlayers[backEndProjectiles[id].playerId])
            backEndPlayers[backEndProjectiles[id].playerId].score += 1;
        }
        io.emit("projectileHit", {
          hitPosition: {
            x: backEndProjectiles[id].x,
            y: backEndProjectiles[id].y,
          },
          velocity: {
            x: backEndProjectiles[id].velocity.x,
            y: backEndProjectiles[id].velocity.y,
          }
        })
        delete backEndProjectiles[id];
        break;
      }
    }
  }
  io.emit("updateProjectiles", backEndProjectiles);
  io.emit("updatePlayers", backEndPlayers);
}, 15);
server.listen(port, () => {
  console.log(`backend app listen on port ${port}`);
});
function setObstacles(map) {
  let obstacles = [];
  for (let i = 0; i < 32 * 32; i++) {
    if (map[i] !== 0) {
      obstacles.push({
        x: Math.floor((i % 32) * 64),
        y: Math.floor(i / 32) * 64,
      });
    }
  }
  return obstacles;
}
function obstacleCollision(x, y, width, height) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];

    if (
      x < o.x + obstacleWidth &&
      x + width > o.x &&
      y < o.y + obstacleHeight &&
      y + height > o.y
    ) {
      return true;
    }
  }
  return false;
}
function resetPlayer(player) {
  let x = 0;
  let y = 0;
  do {
    x = (GAMEWIDTH - 100) * Math.random() + 50;
    y = (GAMEHEIGHT - 200) * Math.random() + 100;
  } while (obstacleCollision(x - 16, y - 32, 32, 64));
  player.x = x;
  player.y = y;
  player.health = 100;
  console.log("huhu");
}
