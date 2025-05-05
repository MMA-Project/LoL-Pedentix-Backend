import * as gameService from "../service/game.service";
import { listGameFiles } from "../repository/game.repository";

import express from "express";

export const gameRouter = express.Router();

gameRouter.get("/start", async (req: any, res: any) => {
  const gameData = await gameService.startDailyGame();
  res.json(gameData);
});

gameRouter.get("/:id", (req: any, res: any) => {
  const game = gameService.getGame(req.params.id);
  if (!game) return res.status(404).send("Game not found");
  res.json(game);
});

gameRouter.get("/", (req: any, res: any) => {
  const files = listGameFiles();
  res.json(files);
});

gameRouter.post("/guess/:id", async (req: any, res: any) => {
  const result = await gameService.makeGuess(req.params.id, req.body.word);
  if (!result) return res.status(404).send("Game not found");
  if (result.alreadyGuessed)
    return res.status(400).send("Game already finished.");
  res.json(result);
});
