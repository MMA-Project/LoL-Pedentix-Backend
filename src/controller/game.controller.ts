import * as gameService from "../service/game.service";

import express from "express";

export const gameRouter = express.Router();

gameRouter.get("/start", async (req: any, res: any) => {
  const gameData = await gameService.startDailyGame();
  res.json(gameData);
});

gameRouter.get("/:id", async (req: any, res: any) => {
  const game = await gameService.getPedantixGame(req.params.id);
  if (!game) return res.status(404).send("Game not found");
  res.json(game);
});

gameRouter.post("/guess/:id", async (req: any, res: any) => {
  const result = await gameService.makeGuess(req.params.id, req.body.word);
  if (!result) return res.status(404).send("Game not found");
  if (result.alreadyGuessed)
    return res.status(400).send("Game already finished.");
  res.json(result);
});
