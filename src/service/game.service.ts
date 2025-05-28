import { getDailySeed } from "../utils/seed";
import { getConjugation, getMaskedText, getSynonyms } from "../utils/words";
import { createDailyGameFromChampion } from "./models/Game";
import {
  createDailyGame,
  saveDailyGame,
  getDailyGame,
  getChampion,
} from "../repository/game.repository";
import { ObjectId } from "mongodb";
import { champions } from "./models/Champion";
import { gameToLeaguePedantix, LeaguePedantix } from "./models/LeaguePedantix";
import NotFoundError from "../errors/NotFound.error";
import NotModifiedError from "../errors/NotModified.error";
import BadRequestError from "../errors/BadRequest.error";

export const startDailyGame = async (): Promise<LeaguePedantix> => {
  const seed = getDailySeed();
  const name = champions[seed % champions.length];
  const champion = await getChampion(name);
  if (!champion) {
    throw new NotFoundError(`Champion ${name} not found`);
  }

  const game = createDailyGameFromChampion(seed, champion);

  const createdId = await createDailyGame(game);
  if (!createdId) {
    throw new Error("Failed to create daily game");
  }
  game.id = createdId;

  return gameToLeaguePedantix(game);
};

export const getPedantixGame = async (id: string): Promise<LeaguePedantix> => {
  if (!ObjectId.isValid(id)) {
    throw new BadRequestError(
      "Invalid id : Must be a 12-byte hexadecimal string"
    );
  }
  const game = await getDailyGame(id);
  if (!game) throw new NotFoundError("Game not found");

  return gameToLeaguePedantix(game);
};

export const makeGuess = async (
  id: string,
  word: string
): Promise<LeaguePedantix> => {
  if (!ObjectId.isValid(id)) {
    throw new BadRequestError(
      "Invalid id : Must be a 12-byte hexadecimal string"
    );
  }
  const game = await getDailyGame(id);
  if (!game) throw new NotFoundError("Game not found");

  const wordLower = word.toLowerCase();

  if (game.guessed) {
    throw new NotModifiedError("Game already guessed");
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    const updatedGame = await saveDailyGame(game);
    if (!updatedGame) {
      throw new NotModifiedError("Game not modified");
    }
    return gameToLeaguePedantix(game);
  }

  if (!game.triedWords.includes(wordLower)) {
    game.triedWords.push(wordLower);
    const synonyms = await getSynonyms(wordLower);
    if (synonyms.length > 0) {
      game.synonymsOfTriedWord.push({
        triedWord: wordLower,
        synonyms: synonyms,
      });
    }

    const conjugaison = await getConjugation(wordLower);
    if (conjugaison.length > 0) {
      game.verbsOfTriedWord.push({
        triedWord: wordLower,
        allFormOfVerb: Array.from(new Set(conjugaison)),
      });
    }
  }

  const updatedGame = await saveDailyGame(game);
  if (!updatedGame) {
    throw new NotModifiedError("Game not modified");
  }

  return gameToLeaguePedantix(game);
};
