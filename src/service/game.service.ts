import { getDailySeed } from "../utils/seed";
import { getConjugation, getSynonyms } from "../utils/words";
import Game, { createDailyGameFromChampion } from "./models/Game";
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

export const syncGame = async (
  existingGameId: string,
  incomingGameId: string
): Promise<LeaguePedantix> => {
  if (!ObjectId.isValid(existingGameId) || !ObjectId.isValid(incomingGameId)) {
    throw new BadRequestError(
      "Invalid id : Must be a 12-byte hexadecimal string"
    );
  }
  const existingGame = await gameRepository.getDailyGame(existingGameId);
  if (!existingGame) throw new NotFoundError("Game not found");
  const game = await gameRepository.getDailyGame(incomingGameId);
  if (!game) throw new NotFoundError("Incoming game not found");

  if (existingGame.guessed) {
    throw new NotModifiedError("Game already guessed");
  }
  if (existingGame.seed !== game.seed) {
    throw new BadRequestError("Seed mismatch");
  }

  if (game.guessed) {
    existingGame.guessed = true;
    await gameRepository.incFindedCountToHistoryRecord(existingGame.seed);
  }

  // Merge triedWords
  existingGame.triedWords = Array.from(
    new Set([...existingGame.triedWords, ...game.triedWords])
  );

  // Merge synonymsOfTriedWord
  const synonyms = new Map(
    [...existingGame.synonymsOfTriedWord, ...game.synonymsOfTriedWord].map(
      (e) => [e.triedWord, e.synonyms]
    )
  );
  for (const e of game.synonymsOfTriedWord) {
    synonyms.set(
      e.triedWord,
      Array.from(new Set([...(synonyms.get(e.triedWord) || []), ...e.synonyms]))
    );
  }
  existingGame.synonymsOfTriedWord = Array.from(
    synonyms,
    ([triedWord, synonyms]) => ({ triedWord, synonyms })
  );

  // Merge verbsOfTriedWord
  const verbs = new Map(
    [...existingGame.verbsOfTriedWord, ...game.verbsOfTriedWord].map((e) => [
      e.triedWord,
      e.allFormOfVerb,
    ])
  );
  for (const e of game.verbsOfTriedWord) {
    verbs.set(
      e.triedWord,
      Array.from(
        new Set([...(verbs.get(e.triedWord) || []), ...e.allFormOfVerb])
      )
    );
  }
  existingGame.verbsOfTriedWord = Array.from(
    verbs,
    ([triedWord, allFormOfVerb]) => ({ triedWord, allFormOfVerb })
  );

  await gameRepository.saveDailyGame(existingGame);

  return gameToLeaguePedantix(existingGame);
};
