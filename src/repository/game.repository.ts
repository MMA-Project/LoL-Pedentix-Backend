import { dailyGamesCollection, dailyHistoryCollection } from "./db/mongo";
import Game from "../service/models/Game";
import { GameDBOToModel, GameModelToDBO } from "./dbo/Game.dbo";
import { ObjectId } from "mongodb";
import { championsCollection } from "./db/mongo";
import { ChampionDBOToModel } from "./dbo/Champion.dbo";
import { Champion } from "../service/models/Champion";
import { getDailySeed } from "../utils/seed";
import HistoryRecord from "../service/models/History";
import {
  HistoryRecordDBOToModel,
  HistoryRecordModelToDBO,
} from "./dbo/History.dbo";

export const getDailyGame = async (id: string): Promise<Game | null> => {
  const game = await dailyGamesCollection.findOne({ _id: new ObjectId(id) });
  return game ? GameDBOToModel(game) : null;
};

export const getHistory = async (): Promise<HistoryRecord[]> => {
  const history = await dailyHistoryCollection
    .find()
    .sort({ seed: -1 })
    .toArray();
  return history ? history.map(HistoryRecordDBOToModel) : [];
};

export const getHistoryBySeed = async (
  seed: number
): Promise<HistoryRecord | null> => {
  const history = await dailyHistoryCollection.findOne({ seed });
  return history ? HistoryRecordModelToDBO(history) : null;
};

export const createHistoryRecord = async (
  historyRecord: HistoryRecord
): Promise<string | null> => {
  const existing = await dailyHistoryCollection.findOne({
    seed: historyRecord.seed,
  });
  if (existing) {
    return existing._id.toString() || null;
  }
  const result = await dailyHistoryCollection.insertOne(
    HistoryRecordModelToDBO(historyRecord)
  );
  return result.insertedId.toString() || null;
};

export const incFindedCountToHistoryRecord = async (
  seed: number
): Promise<number> => {
  const updated = await dailyHistoryCollection.updateOne(
    { seed },
    { $inc: { findedCount: 1 } }
  );
  return updated.modifiedCount;
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

export const getAllChampions = async (): Promise<Champion[]> => {
  const championsDBO = await championsCollection.find().toArray();
  return championsDBO.map(ChampionDBOToModel);
};

export const clearOldDailyGames = async (): Promise<number> => {
  const todaySeed = getDailySeed();
  const deletedGames = await dailyGamesCollection.deleteMany({
    seed: { $ne: todaySeed },
  });
  return deletedGames.deletedCount;
};
