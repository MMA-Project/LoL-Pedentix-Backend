import fs from "fs";
import path from "path";
import { GAMES_DIR } from "../routes/router";
import Game from "../models/Game";

const getGameFilePath = (id: string) => path.join(GAMES_DIR, `${id}.json`);

export const saveGameToFile = (game: Game) => {
  fs.writeFileSync(
    getGameFilePath(game.id),
    JSON.stringify(game, null, 2),
    "utf-8"
  );
};

export const loadGameFromFile = (id: string): Game | null => {
  const filePath = getGameFilePath(id);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
};

export const listGameFiles = (): string[] => {
  return fs.readdirSync(GAMES_DIR);
};
