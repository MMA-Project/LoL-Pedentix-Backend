import { gamesCollection } from "./db/mongo";
import Game from "../service/models/Game";
import { GameDBOToModel, GameModelToDBO } from "./dbo/Game.dbo";
import { ObjectId } from "mongodb";
import { championsCollection } from "./db/mongo";
import { ChampionDBOToModel } from "./dbo/Champion.dbo";
import { Champion } from "../service/models/Champion";
import { getDailySeed } from "../utils/seed";

export const getGame = async (id: string): Promise<Game | null> => {
  const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
  return game ? GameDBOToModel(game) : null;
};

export const createGame = async (game: Game): Promise<void> => {
  await gamesCollection.insertOne(GameModelToDBO(game));
};

export const saveGame = async (game: Game): Promise<void> => {
  const gameDBO = GameModelToDBO(game);
  await gamesCollection.updateOne(
    { _id: gameDBO._id },
    { $set: gameDBO },
    { upsert: true }
  );
};

export const getChampion = async (name: string): Promise<Champion | null> => {
  const championDBO = await championsCollection.findOne({ name });
  return championDBO ? ChampionDBOToModel(championDBO) : null;
};

export const clearOldGames = async (): Promise<void> => {
  const todaySeed = getDailySeed().toString();

  console.log("Clearing old games with seed:", todaySeed);

  await gamesCollection.deleteMany({
    seed: { $ne: todaySeed },
  });
};
