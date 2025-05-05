import express from "express";
import path from "path";
import Game from "../models/Game";
import {
  champions,
  LeaguePedantix,
  LeaguePedantixModel,
} from "../models/LeaguePedantix";
import fs from "fs";
import puppeteer from "puppeteer";
import { getDailySeed } from "../utils/seed";
import cron from "node-cron";

//export const gameRouter = express.Router();

// TEMPORARY: This is a temporary solution to avoid the need for a database
// and to allow for easy testing and development. In a production environment, you should use a proper database.

export const GAMES_DIR = path.join(__dirname, "..", "data", "games");
export const CHAMP_DIR = path.join(__dirname, "..", "data", "champions");

if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

if (!fs.existsSync(CHAMP_DIR)) {
  fs.mkdirSync(CHAMP_DIR, { recursive: true });
}

const getChampionFilePath = (name: string) =>
  path.join(CHAMP_DIR, `${name}.json`);

export const saveChampionToFile = (LeaguePedantix: LeaguePedantixModel) => {
  fs.writeFileSync(
    getChampionFilePath(LeaguePedantix.name),
    JSON.stringify(LeaguePedantix, null, 2),
    "utf-8"
  );
};

export const loadChampionFromFile = (
  name: string
): LeaguePedantixModel | null => {
  const filePath = getChampionFilePath(name);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
};

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
