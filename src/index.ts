import express from "express";
import cors from "cors";

import gameRouter from "./routes/game";

const app = express();
app.use(
  cors({
    origin: [
      "https://mma-project.github.io/LoL-Pedentix/",
      "http://localhost:5173/LoL-Pedentix/",
    ],
  })
);
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Middleware for tracing requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Game routes
app.use("/api/game", gameRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
