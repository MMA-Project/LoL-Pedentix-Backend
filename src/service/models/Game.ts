import { Champion } from "./Champion";

export default interface Game {
  id?: string;
  seed: number;
  mode: string;
  guessed: boolean;
  image: string;
  name: string;
  rawText: string;
  triedWords: string[];
  synonymsOfTriedWord: SynonymsOfTriedWord[];
  verbsOfTriedWord: VerbsOfTriedWord[];
}

export interface SynonymsOfTriedWord {
  triedWord: string;
  synonyms: string[];
}

export interface VerbsOfTriedWord {
  triedWord: string;
  allFormOfVerb: string[];
}

export function createDailyGameFromChampion(
  seed: number,
  champion: Champion
): Game {
  return {
    seed: seed,
    name: champion.name,
    guessed: false,
    image: champion.image,
    mode: "daily",
    rawText: champion.text,
    triedWords: [],
    verbsOfTriedWord: [],
    synonymsOfTriedWord: [],
  };
}
