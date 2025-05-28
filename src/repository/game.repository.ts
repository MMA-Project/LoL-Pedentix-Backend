import { dailyGamesCollection } from "./db/mongo";
import Game from "../service/models/Game";
import { GameDBOToModel, GameModelToDBO } from "./dbo/Game.dbo";
import { ObjectId } from "mongodb";
import { championsCollection } from "./db/mongo";
import { ChampionDBOToModel } from "./dbo/Champion.dbo";
import { Champion } from "../service/models/Champion";
import { getDailySeed } from "../utils/seed";

export const getDailyGame = async (id: string): Promise<Game | null> => {
  const game = await dailyGamesCollection.findOne({ _id: new ObjectId(id) });
  return game ? GameDBOToModel(game) : null;
};

export const createDailyGame = async (game: Game): Promise<string | null> => {
  const gameDBO = GameModelToDBO(game);
  gameDBO._id = new ObjectId();
  const inserted = await dailyGamesCollection.insertOne(gameDBO);
  return inserted.insertedId.toString() || null;
};

export const saveDailyGame = async (game: Game): Promise<number> => {
  const gameDBO = GameModelToDBO(game);
  const updatedGame = await dailyGamesCollection.updateOne(
    { _id: gameDBO._id },
    { $set: gameDBO },
    { upsert: true }
  );
  return updatedGame.modifiedCount;
};

export const getChampion = async (name: string): Promise<Champion | null> => {
  const championDBO = await championsCollection.findOne({ name });
  return championDBO ? ChampionDBOToModel(championDBO) : null;
};

export const clearOldDailyGames = async (): Promise<number> => {
  const todaySeed = getDailySeed();
  const deletedGames = await dailyGamesCollection.deleteMany({
    seed: { $ne: todaySeed },
  });
  return deletedGames.deletedCount;
};
