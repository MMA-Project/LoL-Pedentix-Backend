import express from "express";
import cors from "cors";
import { gameRouter } from "./controller/game.controller";
import { initGameCron } from "./repository/cron/game.cron";
import { errorHandler } from "./middleware";

const app = express();
app.use(
  cors({
    origin: ["https://mma-project.github.io", "http://localhost:5173"],
  })
);
app.use(express.json());

const PORT = 3001;

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

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

initGameCron()
  .then(() => {
    console.log("Game cron initialized successfully.");
  })
  .catch((error) => {
    console.error("Error initializing game cron:", error);
  });
