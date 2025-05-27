import { v4 as uuidv4 } from "uuid";
import { getDailySeed } from "../utils/seed";
import { getConjugation, getMaskedText, getSynonyms } from "../utils/words";
import Game, { createDailyGameFromChampion } from "./models/Game";
import {
  createDailyGame,
  saveDailyGame,
  getDailyGame,
  getChampion,
} from "../repository/game.repository";
import { ObjectId } from "mongodb";
import { champions } from "./models/Champion";
import { LeaguePedantix } from "./models/LeaguePedantix";

export const startDailyGame = async (): Promise<LeaguePedantix> => {
  const seed = getDailySeed();
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const name = champions[Math.floor(seededRandom(seed) * champions.length)];
  const champion = await getChampion(name);
  if (!champion) {
    throw new Error(`Champion ${name} not found`);
  }

  const game = createDailyGameFromChampion(seed, champion);

  const createdId = await createDailyGame(game);
  if (!createdId) {
    throw new Error("Failed to create daily game");
  }

  return {
    gameId: createdId,
    seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.triedWords),
    triedWords: [],
    wordTriedWithGuessed: [],
  };
};

export const getPedantixGame = async (id: string): Promise<LeaguePedantix> => {
  const game = await getDailyGame(id);
  if (!game) throw new Error("Game not found");

  const wordTriedWithGuessed: { wordTried: string; wordsGuessed: string[] }[] =
    [];

  const text = getMaskedText(
    game.rawText,
    game.triedWords,
    wordTriedWithGuessed,
    game.synonymsOfTriedWord,
    game.verbsOfTriedWord
  );

  return {
    gameId: game.id!,
    seed: game.seed,
    guessed: game.guessed,
    text,
    triedWords: game.triedWords,
    wordTriedWithGuessed,
  };
};

export const makeGuess = async (
  id: string,
  word: string
): Promise<LeaguePedantix> => {
  const game = await getDailyGame(id);
  if (!game) throw new Error("Game not found");

  const wordLower = word.toLowerCase();

  if (game.guessed) {
    throw new Error("Game already guessed");
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    await saveDailyGame(game);
    return {
      gameId: game.id!,
      seed: game.seed,
      guessed: game.guessed,
      text: game.rawText,
      title: game.name,
      image: game.image,
      triedWords: game.triedWords,
      wordTriedWithGuessed: [],
    };
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

  await saveDailyGame(game);

  const wordTriedWithGuessed: { wordTried: string; wordsGuessed: string[] }[] =
    [];

  const text = getMaskedText(
    game.rawText,
    game.triedWords,
    wordTriedWithGuessed,
    game.synonymsOfTriedWord,
    game.verbsOfTriedWord
  );

  return {
    gameId: game.id!,
    seed: game.seed,
    guessed: game.guessed,
    text,
    triedWords: game.triedWords,
    wordTriedWithGuessed,
  };
};
