// Main Server Entry Point
import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import * as path from "path";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";
import { PORT } from "./config/constants";
import { setupSocketHandlers } from "./handlers/socketHandlers";
import { startGameLoop } from "./game/gameLoop";

// Initialize Express app
const app = express();

// Serve static files from the public directory
app.use(express.static("public"));

// Serve the main HTML file
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with configuration
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  pingInterval: 2000,
  pingTimeout: 5000,
});

// Setup Socket.IO event handlers
setupSocketHandlers(io);

// Start the game loop
startGameLoop(io);

// Start the server
server.listen(PORT, () => {
  console.log(`backend app listen on port ${PORT}`);
});
