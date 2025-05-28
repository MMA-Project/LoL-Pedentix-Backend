export interface LeaguePedantix {
  gameId: string;
  seed: number;
  guessed: boolean;
  title?: string;
  image?: string;
  text: string;
  triedWords: string[];
  wordTriedWithGuessed: any[];
}
