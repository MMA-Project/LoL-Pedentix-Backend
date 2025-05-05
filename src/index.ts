import express from "express";
import cors from "cors";
import { gameRouter } from "./controller/game.controller";

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
