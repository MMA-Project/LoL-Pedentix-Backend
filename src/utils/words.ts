import { PorterStemmerFr } from "natural";

export function getMaskedText(text: string, triedWords: string[]): string {
  const lowerTried = triedWords.map((w) => w.toLowerCase());
  const foundSet = new Set(lowerTried);

  const stemsToTried = new Map<string, string>();
  for (const tried of lowerTried) {
    const stem = PorterStemmerFr.stem(tried);
    stemsToTried.set(stem, tried);
  }

  return text.replace(/\b[\p{L}]+(?:'[\p{L}]+)*\b/gu, (word) => {
    const lower = word.toLowerCase();

    if (foundSet.has(lower)) {
      return word;
    }

    const wordStem = PorterStemmerFr.stem(lower);

    if (stemsToTried.has(wordStem)) {
      const guessedWord = stemsToTried.get(wordStem)!;
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
