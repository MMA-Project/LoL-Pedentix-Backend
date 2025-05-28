import Game, { Synonyms, Verbs } from "../../service/models/Game";
import { ObjectId, WithId } from "mongodb";

export default interface GameDBO {
  _id: ObjectId;
  seed: number;
  mode: string;
  guessed: boolean;
  image: string;
  name: string;
  rawText: string;
  triedWords: string[];
  synonymsOfTriedWord: Synonyms[];
  verbsOfTriedWord: Verbs[];
}

export const GameDBOToModel: (game: WithId<GameDBO>) => Game = (game) => {
  return {
    id: game._id.toString(),
    seed: game.seed,
    mode: game.mode,
    guessed: game.guessed,
    image: game.image,
    name: game.name,
    rawText: game.rawText,
    triedWords: game.triedWords,
    synonymsOfTriedWord: game.synonymsOfTriedWord,
    verbsOfTriedWord: game.verbsOfTriedWord,
  };
};

export const GameModelToDBO: (game: Game) => WithId<GameDBO> = (game) => {
  return {
    _id: new ObjectId(game.id),
    seed: game.seed,
    mode: game.mode,
    guessed: game.guessed,
    image: game.image,
    name: game.name,
    rawText: game.rawText,
    triedWords: game.triedWords,
    synonymsOfTriedWord: game.synonymsOfTriedWord,
    verbsOfTriedWord: game.verbsOfTriedWord,
  };
};
