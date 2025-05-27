import { v4 as uuidv4 } from "uuid";
import { getDailySeed } from "../utils/seed";
import { getLeaguePedantixfromSeed } from "../routes/router";
import { getConjugation, getMaskedText, getSynonyms } from "../utils/words";
import Game from "./models/Game";
import { createGame, saveGame, getGame } from "../repository/game.repository";
import { ObjectId } from "mongodb";

export const startDailyGame = async (): Promise<any> => {
  const seed = getDailySeed();
  const chosen = await getLeaguePedantixfromSeed(seed);
  const gameId = new ObjectId();

  const game: Game = {
    id: gameId.toString(),
    seed: seed.toString(),
    name: chosen.name,
    guessed: false,
    image: chosen.image,
    mode: "daily",
    rawText: chosen.text,
    triedWords: [],
    verbsOfTriedWord: [],
    synonymsOfTriedWord: [],
  };

  await createGame(game);

  return {
    gameId,
    seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.triedWords),
    triedWords: [],
    wordTriedWithGuessed: [],
  };
};

export const getPedantixGame = async (id: string): Promise<any> => {
  const game = await getGame(id);
  if (!game) return null;

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
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text,
    triedWords: game.triedWords,
    wordTriedWithGuessed,
  };
};

export const makeGuess = async (id: string, word: string): Promise<any> => {
  const game = await getGame(id);
  if (!game) return null;

  const wordLower = word.toLowerCase();

  if (game.guessed) {
    return { alreadyGuessed: true };
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    await saveGame(game);
    return {
      gameId: game.id,
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

  await saveGame(game);

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
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text,
    triedWords: game.triedWords,
    wordTriedWithGuessed,
  };
};
