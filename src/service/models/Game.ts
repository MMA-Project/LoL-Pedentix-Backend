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
  verbsOfTriedWord: Verbs[];
}

export interface Synonyms {
  triedWord: string;
  synonyms: string[];
}

export interface Verbs {
  triedWord: string;
  allFormOfVerb: string[];
}
