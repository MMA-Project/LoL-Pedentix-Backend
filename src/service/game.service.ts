import { v4 as uuidv4 } from "uuid";
import { getDailySeed } from "../utils/seed";
import { getLeaguePedantixfromSeed } from "../routes/router";
import { getMaskedText, getSynonyms } from "../utils/words";
import Game from "../models/Game";
import {
  saveGameToFile,
  loadGameFromFile,
} from "../repository/game.repository";

export const startDailyGame = async (): Promise<any> => {
  const seed = getDailySeed();
  const chosen = await getLeaguePedantixfromSeed(seed);
  const gameId = uuidv4();

  const game: Game = {
    id: gameId,
    seed: seed.toString(),
    name: chosen.name,
    guessed: false,
    image: chosen.image,
    mode: "daily",
    rawText: chosen.text,
    triedWords: [],
    synonymsOfTriedWord: [],
  };

  saveGameToFile(game);

  return {
    gameId,
    seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.triedWords),
  };
};

export const getGame = (id: string): any => {
  const game = loadGameFromFile(id);
  if (!game) return null;

  return {
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text: getMaskedText(game.rawText, game.triedWords),
    triedWords: game.triedWords,
  };
};

export const makeGuess = async (id: string, word: string): Promise<any> => {
  const game = loadGameFromFile(id);
  if (!game) return null;

  const wordLower = word.toLowerCase();

  if (game.guessed) {
    return { alreadyGuessed: true };
  }

  if (game.name.toLowerCase() === wordLower) {
    game.guessed = true;
    saveGameToFile(game);
    return {
      guessedCorrectly: true,
      gameId: game.id,
      seed: game.seed,
      guessed: game.guessed,
      text: game.rawText,
      title: game.name,
      image: game.image,
      triedWords: game.triedWords,
    };
  }

  if (!game.triedWords.includes(wordLower)) {
    game.triedWords.push(wordLower);
    const synonyms = await getSynonyms(wordLower);
    game.synonymsOfTriedWord.push({
      triedWord: wordLower,
      synonyms: synonyms,
    });
  }

  saveGameToFile(game);

  return {
    gameId: game.id,
    seed: game.seed,
    guessed: game.guessed,
    text: getMaskedText(
      game.rawText,
      game.triedWords,
      game.synonymsOfTriedWord
    ),
    triedWords: game.triedWords,
  };
};
