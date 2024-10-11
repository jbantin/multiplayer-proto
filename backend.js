const express = require("express");
const app = express();

const mapData = require("./multiMap.json");
const map = mapData.layers[0].data;
const foregroundMap = mapData.layers[1].data;
console.log(foregroundMap);
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
const SPEED = 5;
const RADIUS = 15;
const PROJECTILE_RADIUS = 5;
let projectileId = 0;
io.on("connection", (socket) => {
  console.log("a user connected");
  io.emit("map", { map, foregroundMap });
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
    backEndPlayers[socket.id] = {
      x: GAMEWIDTH * Math.random(),
      y: GAMEHEIGHT * Math.random(),
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
        if (backEndPlayer.x - backEndPlayer.radius < 0)
          backEndPlayer.x = backEndPlayer.radius;
        break;
      case "KeyW":
        backEndPlayer.y -= SPEED;
        if (backEndPlayer.y - backEndPlayer.radius < 0)
          backEndPlayer.y = backEndPlayer.radius;
        break;
      case "KeyS":
        backEndPlayer.y += SPEED;
        if (backEndPlayer.y + backEndPlayer.radius > GAMEHEIGHT)
          backEndPlayer.y = GAMEHEIGHT - backEndPlayer.radius;
        break;
      case "KeyD":
        backEndPlayer.x += SPEED;
        if (backEndPlayer.x + backEndPlayer.radius > GAMEWIDTH)
          backEndPlayer.x = GAMEWIDTH - backEndPlayer.radius;
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
          delete backEndPlayers[playerId];
          if (backEndPlayers[backEndProjectiles[id].playerId])
            backEndPlayers[backEndProjectiles[id].playerId].score += 1;
        }
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
