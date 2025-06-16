import { getDailySeed } from "../utils/seed";
import { getConjugation, getSynonyms } from "../utils/words";
import { createDailyGameFromChampion } from "./models/Game";
import * as gameRepository from "../repository/game.repository";
import { ObjectId } from "mongodb";
import { gameToLeaguePedantix, LeaguePedantix } from "./models/LeaguePedantix";
import NotFoundError from "../errors/NotFound.error";
import NotModifiedError from "../errors/NotModified.error";
import BadRequestError from "../errors/BadRequest.error";
import HistoryRecord from "./models/History";

export const startDailyGame = async (): Promise<LeaguePedantix> => {
  const seed = getDailySeed();
  const dailyRecord = await gameRepository.getHistoryBySeed(seed);
  if (!dailyRecord) {
    throw new NotFoundError(`Daily record for seed ${seed} not found`);
  }
  const champion = await gameRepository.getChampion(dailyRecord.name);
  if (!champion) {
    throw new NotFoundError(`Champion ${dailyRecord.name} not found`);
  }

  const game = createDailyGameFromChampion(seed, champion);

  const createdId = await gameRepository.createDailyGame(game);
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
  const game = await gameRepository.getDailyGame(id);
  if (!game) throw new NotFoundError("Game not found");

  return gameToLeaguePedantix(game);
};

export const getHistory = async (): Promise<HistoryRecord[]> => {
  const history = await gameRepository.getHistory();
  history[0].name = "";
  return history;
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
  const game = await gameRepository.getDailyGame(id);
  if (!game) throw new NotFoundError("Game not found");

  const wordLower = word.toLowerCase();

  if (game.guessed) {
    throw new NotModifiedError("Game already guessed");
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    await gameRepository.saveDailyGame(game);
    await gameRepository.incFindedCountToHistoryRecord(game.seed);
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

  await gameRepository.saveDailyGame(game);

  return gameToLeaguePedantix(game);
};
