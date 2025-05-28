import { getMaskedText } from "../../utils/words";
import Game from "./Game";

export interface LeaguePedantix {
  gameId: string;
  seed: number;
  guessed: boolean;
  title?: string;
  image?: string;
  text: string;
  triedWords: string[];
  wordTriedWithGuessed: { wordTried: string; wordsGuessed: string[] }[];
}

export function gameToLeaguePedantix(game: Game): LeaguePedantix {
  const wordTriedWithGuessed: { wordTried: string; wordsGuessed: string[] }[] =
    [];
  if (game.guessed)
    return {
      gameId: game.id!,
      seed: game.seed,
      guessed: game.guessed,
      title: game.name,
      image: game.image,
      text: game.rawText,
      triedWords: game.triedWords || [],
      wordTriedWithGuessed: [],
    };
  return {
    gameId: game.id!,
    seed: game.seed,
    guessed: game.guessed,
    text: getMaskedText(
      game.rawText,
      game.triedWords,
      wordTriedWithGuessed,
      game.synonymsOfTriedWord,
      game.verbsOfTriedWord
    ),
    triedWords: game.triedWords || [],
    wordTriedWithGuessed: wordTriedWithGuessed || [],
  };
}
