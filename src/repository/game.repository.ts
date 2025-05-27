import { gamesCollection } from "./db/mongo";
import Game from "../service/models/Game";
import { GameDBOToModel, GameModelToDBO } from "./dbo/Game.dbo";
import { ObjectId } from "mongodb";

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
