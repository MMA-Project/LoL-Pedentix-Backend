import express from "express";
import cors from "cors";
import { gameRouter } from "./controller/game.controller";
import { initGameCron } from "./service/cron/game.cron";
import { errorHandler } from "./middleware";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuid } from "uuid";
import Game from "./service/models/Game";
import { LeaguePedantix } from "./service/models/LeaguePedantix";

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
function broadcastRoomSize(roomId: string) {
  const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
  io.to(roomId).emit("room-update", { size });
}
io.on("connection", (socket) => {
  // Création d'une room
  socket.on("create-room", ({ gameId }, callback) => {
    const roomId = uuid()
      .replace(/-/g, "")
      .slice(0, 20)
      .replace(/[0-9]/g, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      );
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.gameId = gameId;

    console.log(`Room ${roomId} created by ${socket.id} for game ${gameId}`);
    callback({ roomId });
  });

  // Rejoindre une room existante
  socket.on("join-room", ({ roomId, gameId }, callback) => {
    const rooms = io.sockets.adapter.rooms;
    if (!rooms.has(roomId)) {
      return callback({ roomId: null, error: "Room does not exist" });
    }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.gameId = gameId;

    console.log(`User ${socket.id} joined room ${roomId} with game ${gameId}`);
    broadcastRoomSize(roomId);
    callback({ roomId });
  });

  socket.on("new-guess", (game: LeaguePedantix) => {
    const roomId = socket.data.roomId;
    if (roomId) {
      console.log(`New guess in room ${roomId} for game ${game.gameId}`);
      io.to(roomId).emit("new-guess", { game });
    }
  });
  socket.on("disconnecting", () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      // Delay the broadcast slightly to ensure socket leaves the room before we count
      setTimeout(() => {
        broadcastRoomSize(roomId);
      }, 100); // petite marge
    }
  });
});
io.on("error", (error) => {
  console.error("Socket.IO error:", error);
});

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

initGameCron()
  .then(() => {
    console.log("Game cron initialized successfully.");
  })
  .catch((error) => {
    console.error("Error initializing game cron:", error);
  });
