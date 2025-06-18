import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { getPedantixGame, syncGame } from "./service/game.service";
import { getLockKey, runWithLock } from "./utils/lock";

export function setupSocket(io: Server) {
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
        `Synchronizing games in room ${roomId} for gameIds: ${gameIds.join(
          ", "
        )}`
      );
      socketsInRoom.forEach(async (s) => {
        console.log(
          `Broadcasting Sync to game ${s.data.gameId} in room ${roomId}`
        );
        try {
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

      io.in(roomId)
        .fetchSockets()
        .then((sockets) => {
          sockets.forEach(async (s) => {
            const toGameId = s.data.gameId;
            if (s.id !== socket.id && s.data.gameId !== gameId) {
              const key = getLockKey(gameId, toGameId);
              console.log(
                `Broadcasting new guess to game ${toGameId} in room ${roomId}`
              );

              await runWithLock(key, async () => {
                try {
                  const game = await syncGame(toGameId, gameId);
                  s.emit("new-guess", { game });
                } catch (err) {
                  console.error("Error during sync:", err);
                }
              });
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
}
