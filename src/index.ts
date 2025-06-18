import express from "express";
import cors from "cors";
import { gameRouter } from "./controller/game.controller";
import { initDailyGameCron } from "./service/cron/game.cron";
import { Server } from "socket.io";
import http from "http";
import { setupSocket } from "./socket";

const PORT = 3001;
const app = express();
app.use(
  cors({
    origin: ["https://mma-project.github.io", "http://localhost:5173"],
  })
);
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://mma-project.github.io", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Setup WebSocket routes
setupSocket(io);

// Middleware for tracing requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Welcome to the Word Guessing Game API!");
});

// Game routes
app.use("/api/game", gameRouter);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

initDailyGameCron()
  .then(() => {
    console.log("Game cron initialized successfully.");
  })
  .catch((error) => {
    console.error("Error initializing game cron:", error);
  });
