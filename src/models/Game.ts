export default interface Game {
  id: string;
  seed: string;
  mode: string;
  guessed: boolean;
  image: string;
  name: string;
  rawText: string;
  triedWords: string[];
  synonymsOfTriedWord: Synonyms[];
}

export interface Synonyms {
  triedWord: string;
  synonyms: string[];
}
