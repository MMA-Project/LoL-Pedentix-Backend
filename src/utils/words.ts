import { LevenshteinDistance, PorterStemmerFr } from "natural";
import { Synonyms, Verbs } from "../service/models/Game";
const Reverso = require("reverso-api");
const reverso = new Reverso();

export function getMaskedText(
  text: string,
  triedWords: string[],
  wordTriedWithGuessed?: { wordTried: string; wordsGuessed: string[] }[],
  synonymsOfTriedWord?: Synonyms[],
  verbsOfTriedWord?: Verbs[]
): string {
  const lowerTried = triedWords.map((w) => w.toLowerCase());
  const foundSet = new Set(lowerTried);
  const allFormOfVerbs = new Set<string>(
    verbsOfTriedWord?.flatMap((v) => v.allFormOfVerb) ?? []
  );

  const stemsToTried = new Map<string, string>();
  const stemsSynonymToTried = new Map<string, string>();
  for (const tried of lowerTried) {
    const stem = PorterStemmerFr.stem(tried);
    stemsToTried.set(stem, tried);
  }
  synonymsOfTriedWord?.forEach(({ triedWord, synonyms }) => {
    synonyms.forEach((synonym) => {
      const stem = PorterStemmerFr.stem(synonym);
      stemsSynonymToTried.set(stem, triedWord);
    });
  });

  return text.replace(/[\p{L}]+/gu, (word) => {
    const lower = word.toLowerCase();

    const wordStem = PorterStemmerFr.stem(lower);

    if (lower === "dieux") console.log(lower, wordStem, stemsToTried);

    const updateWordGuessedList = (word: string) => {
      const triedWord =
        stemsToTried.get(PorterStemmerFr.stem(word)) ??
        verbsOfTriedWord?.find((v) => v.allFormOfVerb.includes(word))
          ?.triedWord;
      const existingEntry = wordTriedWithGuessed?.find(
        (entry) => entry.wordTried === triedWord
      );
      if (existingEntry) {
        if (!existingEntry.wordsGuessed.includes(word)) {
          existingEntry.wordsGuessed.push(word);
        }
      } else {
        wordTriedWithGuessed?.push({
          wordTried: triedWord as string,
          wordsGuessed: [word],
        });
      }
    };

    if (
      foundSet.has(lower) ||
      stemsToTried.has(wordStem) ||
      allFormOfVerbs.has(lower)
    ) {
      updateWordGuessedList(lower);
      return word;
    }

    const closeWord = lowerTried.find((tried) => areCloseWords(lower, tried));
    if (closeWord) {
      return `{${closeWord}}`;
    }

    if (stemsSynonymToTried.has(wordStem)) {
      const guessedWord = stemsSynonymToTried.get(wordStem)!;
      return `[${guessedWord}]`;
    }

    return word.replace(/[\p{L}]/gu, "●");
  });
}

export async function getSynonyms(word: string) {
  return await new Promise<string[]>((resolve, reject) => {
    reverso.getSynonyms(word, "french", (err: any, response: any) => {
      if (!err && response.synonyms) {
        resolve(response.synonyms.map((syn: any) => syn.synonym));
      } else {
        reject(err);
      }
    });
  });
}

export async function getConjugation(word: string) {
  return await new Promise<string[]>((resolve, reject) => {
    reverso.getConjugation(word, "french", (err: any, response: any) => {
      if (!err && response) {
        resolve(response.verbForms.flatMap((form: any) => form.verbs));
      } else {
        reject(err);
      }
    });
  });
}

function areCloseWords(word1: string, word2: string): boolean {
  // Autoriser une petite distance de Levenshtein
  const distance = LevenshteinDistance(word1, word2);
  //console.log("Distance:", distance, word1, word2);
  const maxDistance = Math.max(word1.length, word2.length) * 0.2; // 20% de la longueur du mot le plus long
  if (distance > maxDistance) return false;
  if (distance <= 1) return true;

  // Ajoute comparaison phonétique
  const phon1 = simpleFrenchPhonetic(word1);
  const phon2 = simpleFrenchPhonetic(word2);
  return phon1 === phon2;
}

function simpleFrenchPhonetic(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD") // enlève les accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ph/g, "f")
    .replace(/ch/g, "sh")
    .replace(/gn/g, "n")
    .replace(/eau/g, "o")
    .replace(/au/g, "o")
    .replace(/ou/g, "u")
    .replace(/qu/g, "k")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/x/g, "ks")
    .replace(/y/g, "i")
    .replace(/h/g, "") // muet
    .replace(/(.)\1+/g, "$1") // supprime doublons
    .replace(/[^a-z]/g, "");
}
