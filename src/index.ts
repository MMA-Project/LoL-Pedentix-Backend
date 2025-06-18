import express from "express";
import cors from "cors";
import { gameRouter } from "./controller/game.controller";
import { initGameCron } from "./service/cron/game.cron";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuid } from "uuid";
import { getPedantixGame, syncGame } from "./service/game.service";

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
  socket.on("join-room", async ({ roomId, gameId }, callback) => {
    const rooms = io.sockets.adapter.rooms;
    if (!rooms.has(roomId)) {
      return callback({ roomId: null, error: "Room does not exist" });
    }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.gameId = gameId;

    console.log(`Room ${roomId} joined by ${socket.id} with game ${gameId}`);
    broadcastRoomSize(roomId);
    const socketsInRoom = await io.in(roomId).fetchSockets();
    const gameIds = Array.from(
      new Set(socketsInRoom.map((s) => s.data.gameId).filter(Boolean))
    );
    console.log(
      `Synchronizing games in room ${roomId} for gameIds: ${gameIds.join(", ")}`
    );
    socketsInRoom.forEach(async (s) => {
      console.log(
        `Broadcasting Sync to game ${s.data.gameId} in room ${roomId}`
      );
      try {
        // Synchronize the game state for the other sockets
        await Promise.all(
          gameIds.map(async (id) => {
            if (s.data.gameId === id) return;
            console.log(
              `Synchronizing game ${id} for socket ${s.id} in room ${roomId}`
            );
            return await syncGame(s.data.gameId, id);
          })
        );
        const game = await getPedantixGame(s.data.gameId);
        s.emit("new-guess", { game });
      } catch (error) {
        console.error("Error synchronizing game:", error);
      }
    });
    callback({ roomId });
  });

  socket.on("new-guess", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const gameId = socket.data.gameId;
    console.log(`New guess in room ${roomId} for game ${gameId}`);

    // Broadcast to all other sockets in the same room, including different gameIds
    io.in(roomId)
      .fetchSockets()
      .then((sockets) => {
        sockets.forEach(async (s) => {
          if (s.id !== socket.id && s.data.gameId !== gameId) {
            console.log(
              `Broadcasting new guess to game ${s.data.gameId} in room ${roomId}`
            );
            try {
              // Synchronize the game state for the other sockets
              const game = await syncGame(s.data.gameId, gameId);
              s.emit("new-guess", { game });
            } catch (error) {
              console.error("Error synchronizing game:", error);
            }
          }
        });
      });
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
