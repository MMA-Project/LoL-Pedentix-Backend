import express from "express";
import { v4 as uuidv4 } from "uuid";
import Game from "../models/Game";
import { getMaskedText } from "../utils/words";
import path from "path";
import fs from "fs";
import { getDailySeed } from "../utils/seed";
import {
  champions,
  LeaguePedantix,
  LeaguePedantixModel,
} from "../models/LeaguePedantix";
import cron from "node-cron";
import puppeteer from "puppeteer";

const router = express.Router();

const GAMES_DIR = path.join(__dirname, "..", "data", "games");
const CHAMP_DIR = path.join(__dirname, "..", "data", "champions");

if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

if (!fs.existsSync(CHAMP_DIR)) {
  fs.mkdirSync(CHAMP_DIR, { recursive: true });
}

const getChampionFilePath = (name: string) =>
  path.join(CHAMP_DIR, `${name}.json`);

const getGameFilePath = (id: string) => path.join(GAMES_DIR, `${id}.json`);

const saveGameToFile = (game: Game) => {
  fs.writeFileSync(
    getGameFilePath(game.id),
    JSON.stringify(game, null, 2),
    "utf-8"
  );
};

const saveChampionToFile = (LeaguePedantix: LeaguePedantixModel) => {
  fs.writeFileSync(
    getChampionFilePath(LeaguePedantix.name),
    JSON.stringify(LeaguePedantix, null, 2),
    "utf-8"
  );
};

const loadGameFromFile = (id: string): Game | null => {
  const filePath = getGameFilePath(id);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
};

const loadChampionFromFile = (name: string): LeaguePedantixModel | null => {
  const filePath = getChampionFilePath(name);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
};

router.get("/start", async (req, res) => {
  const seed = getDailySeed();

  const chosen = await getLeaguePedantixfromSeed(seed);

  const gameId = uuidv4();
  const game: Game = {
    id: gameId,
    seed: seed.toString(),
    name: chosen.name,
    guessed: false,
    image: chosen.image,
    mode: "daily",
    rawText: chosen.text,
    foundWords: [],
  };

  saveGameToFile(game);

  res.json({
    gameId,
    seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.foundWords),
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;

  const game = loadGameFromFile(id);
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  res.json({
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.foundWords),
    foundWords: game.foundWords,
  });
});

router.get("/", (req, res) => {
  const gameFiles = fs.readdirSync(GAMES_DIR);
  res.json(gameFiles);
});

router.post("/guess/:id", (req, res) => {
  const { id } = req.params;
  const { word } = req.body;

  const game = loadGameFromFile(id);
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  if (game.guessed) {
    res.status(400).send("Game already finished.");
    return;
  }

  const wordLower = word.toLowerCase();

  if (game.foundWords.includes(wordLower)) {
    res.status(400).send("Word already found.");
    return;
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    saveGameToFile(game);
    res.json({
      gameId: game.id,
      seed: game.seed,
      guessed: game.guessed,
      text: game.rawText,
      title: game.name,
      image: game.image,
      foundWords: game.foundWords,
    });
    return;
  }

  let correct = false;
  if (game.rawText.toLowerCase().includes(wordLower)) {
    game.foundWords.push(wordLower);
    saveGameToFile(game);
    correct = true;
  }

  res.json({
    correct,
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.foundWords),
    foundWords: game.foundWords,
  });
});

export default router;

const clearOldGames = () => {
  const files = fs.readdirSync(GAMES_DIR);
  const todaySeed = getDailySeed().toString();

  files.forEach((file) => {
    const filePath = path.join(GAMES_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const game: Game = JSON.parse(content);

    if (game.seed !== todaySeed) {
      fs.unlinkSync(filePath);
    }
  });
};

cron.schedule("0 0 * * *", () => {
  clearOldGames();
  console.log("Old games cleared at midnight.");
});
clearOldGames();

export const getAllLeaguePedantix = async (): Promise<void> => {
  for (let i = 0; i < champions.length; i++) {
    const champion = champions[i];
    const url = `https://universe.leagueoflegends.com/fr_FR/story/champion/${champion}/`;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    const text = await page.$$eval(".p_1_sJ", (elements) =>
      elements.map((el) => el.textContent?.trim()).join(" \n")
    );

    const image = await page.$eval(".image_3oOd", (el) => {
      const style = el.getAttribute("style") || "";
      const match = style.match(/url\(['"]?(.*?)['"]?\)/);
      return match ? match[1] : "";
    });

    console.log(champion, image);
    saveChampionToFile(new LeaguePedantix(champion, image, text));

    await browser.close();
  }
};
//getAllLeaguePedantix();

export const getLeaguePedantixfromSeed = async (
  seed: number
): Promise<LeaguePedantixModel> => {
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const name = champions[Math.floor(seededRandom(seed) * champions.length)];
  const champion = loadChampionFromFile(name);
  return champion!!;
};
