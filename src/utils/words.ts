import { LevenshteinDistance, PorterStemmerFr } from "natural";
import { Synonyms } from "../models/Game";
const Reverso = require("reverso-api");
const reverso = new Reverso();

export function getMaskedText(
  text: string,
  triedWords: string[],
  synonymsOfTriedWord?: Synonyms[]
): string {
  const lowerTried = triedWords.map((w) => w.toLowerCase());
  const foundSet = new Set(lowerTried);

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

  console.log(
    "stemsToTried",
    stemsToTried
    // "stemsSynonymToTried",
    // stemsSynonymToTried
  );

  return text.replace(/[\p{L}]+(?:'[\p{L}]+)*/gu, (word) => {
    const lower = word.toLowerCase();

    if (lowerTried.some((tried) => areCloseWords(lower, tried))) {
      return word;
    }

    const wordStem = PorterStemmerFr.stem(lower);

    if (stemsToTried.has(wordStem)) {
      return word;
    }

    if (stemsSynonymToTried.has(wordStem)) {
      const guessedWord = stemsSynonymToTried.get(wordStem)!;
      return `[${guessedWord}]`;
    }

    if (word.includes("'")) {
      const parts = word.split("'");
      const maskedParts = parts.map((part) =>
        foundSet.has(part.toLowerCase()) ? part : part.replace(/[\p{L}]/gu, "●")
      );
      return maskedParts.join("'");
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

function areCloseWords(word1: string, word2: string): boolean {
  if (word1 === word2) return true;

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
