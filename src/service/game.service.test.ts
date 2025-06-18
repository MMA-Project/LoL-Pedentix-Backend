// MOCK AVANT IMPORT
jest.mock("../repository/game.repository", () => ({
  getHistoryBySeed: jest.fn(),
  getChampion: jest.fn(),
  createDailyGame: jest.fn(),
  getDailyGame: jest.fn(),
  saveDailyGame: jest.fn(),
  incFindedCountToHistoryRecord: jest.fn(),
  getAllChampions: jest.fn(),
  getHistory: jest.fn(),
}));

jest.mock("../utils/seed", () => ({
  getDailySeed: jest.fn(() => 123456),
}));

jest.mock("../utils/words", () => ({
  getSynonyms: jest.fn(() => ["syn1"]),
  getConjugation: jest.fn(() => ["form1"]),
}));

jest.mock("./models/Game", () => ({
  createDailyGameFromChampion: jest.fn((seed, champion) => ({
    id: null,
    seed,
    name: champion.name,
    guessed: false,
    triedWords: [],
    synonymsOfTriedWord: [],
    verbsOfTriedWord: [],
  })),
}));

jest.mock("./models/LeaguePedantix", () => ({
  gameToLeaguePedantix: jest.fn((game) => game),
}));

// IMPORTS APRÈS MOCKS
import * as gameService from "./game.service";
import * as repo from "../repository/game.repository";
import { ObjectId } from "mongodb";
import NotFoundError from "../errors/NotFound.error";
import BadRequestError from "../errors/BadRequest.error";
import NotModifiedError from "../errors/NotModified.error";

describe("game.service - full test coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startDailyGame", () => {
    it("should return a valid game", async () => {
      (repo.getHistoryBySeed as jest.Mock).mockResolvedValue({ name: "Ahri" });
      (repo.getChampion as jest.Mock).mockResolvedValue({ name: "Ahri" });
      (repo.createDailyGame as jest.Mock).mockResolvedValue("123");

      const result = await gameService.startDailyGame();
      const game = result as any;

      expect(game.id).toBe("123");
      expect(game.name).toBe("Ahri");
    });

    it("should throw if no history found", async () => {
      (repo.getHistoryBySeed as jest.Mock).mockResolvedValue(null);
      await expect(gameService.startDailyGame()).rejects.toThrow(NotFoundError);
    });

    it("should throw if no champion found", async () => {
      (repo.getHistoryBySeed as jest.Mock).mockResolvedValue({ name: "Ahri" });
      (repo.getChampion as jest.Mock).mockResolvedValue(null);
      await expect(gameService.startDailyGame()).rejects.toThrow(NotFoundError);
    });

    it("should throw if createDailyGame fails", async () => {
      (repo.getHistoryBySeed as jest.Mock).mockResolvedValue({ name: "Ahri" });
      (repo.getChampion as jest.Mock).mockResolvedValue({ name: "Ahri" });
      (repo.createDailyGame as jest.Mock).mockResolvedValue(null);
      await expect(gameService.startDailyGame()).rejects.toThrow(
        "Failed to create daily game"
      );
    });
  });

  describe("getPedantixGame", () => {
    it("should throw on invalid id", async () => {
      await expect(gameService.getPedantixGame("invalid")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw if game not found", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue(null);
      await expect(
        gameService.getPedantixGame(new ObjectId().toString())
      ).rejects.toThrow(NotFoundError);
    });

    it("should return game", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue({
        id: "1",
        name: "Ahri",
      });
      const result = await gameService.getPedantixGame(
        new ObjectId().toString()
      );
      expect((result as any).name).toBe("Ahri");
    });
  });

  describe("getHistory", () => {
    it("should return history with name overwritten", async () => {
      (repo.getHistory as jest.Mock).mockResolvedValue([{ name: "Ahri" }]);
      const result = await gameService.getHistory();
      expect(result[0].name).toBe("");
    });
  });

  describe("getAllChampionsNames", () => {
    it("should return all champion names", async () => {
      (repo.getAllChampions as jest.Mock).mockResolvedValue([
        { name: "Ahri" },
        { name: "Zed" },
      ]);
      const names = await gameService.getAllChampionsNames();
      expect(names).toEqual(["Ahri", "Zed"]);
    });
  });

  describe("makeGuess", () => {
    const baseGame = {
      id: "1",
      seed: 123456,
      name: "Ahri",
      guessed: false,
      triedWords: [],
      synonymsOfTriedWord: [],
      verbsOfTriedWord: [],
    };

    it("should throw BadRequestError for invalid id", async () => {
      await expect(gameService.makeGuess("bad_id", "word")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw NotFoundError if game not found", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue(null);
      await expect(
        gameService.makeGuess(new ObjectId().toString(), "Lux")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotModifiedError if already guessed", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue({
        ...baseGame,
        guessed: true,
      });
      await expect(
        gameService.makeGuess(new ObjectId().toString(), "Ahri")
      ).rejects.toThrow(NotModifiedError);
    });

    it("should win the game if word is correct", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue({ ...baseGame });
      (repo.saveDailyGame as jest.Mock).mockResolvedValue(1);
      (repo.incFindedCountToHistoryRecord as jest.Mock).mockResolvedValue(1);

      const result = await gameService.makeGuess(
        new ObjectId().toString(),
        "Ahri"
      );
      expect((result as any).guessed).toBe(true);
    });

    it("should enrich game if word is incorrect and new", async () => {
      (repo.getDailyGame as jest.Mock).mockResolvedValue({ ...baseGame });
      (repo.saveDailyGame as jest.Mock).mockResolvedValue(1);

      const result = await gameService.makeGuess(
        new ObjectId().toString(),
        "Lux"
      );
      const g = result as any;
      expect(g.triedWords).toContain("lux");
      expect(g.synonymsOfTriedWord[0].synonyms).toContain("syn1");
      expect(g.verbsOfTriedWord[0].allFormOfVerb).toContain("form1");
    });

    it("should skip enrichment if word already tried", async () => {
      const game = { ...baseGame, triedWords: ["lux"] };
      const words = require("../utils/words");
      const spySyn = jest.spyOn(words, "getSynonyms");
      const spyConj = jest.spyOn(words, "getConjugation");

      (repo.getDailyGame as jest.Mock).mockResolvedValue(game);
      (repo.saveDailyGame as jest.Mock).mockResolvedValue(1);

      await gameService.makeGuess(new ObjectId().toString(), "Lux");

      expect(spySyn).not.toHaveBeenCalled();
      expect(spyConj).not.toHaveBeenCalled();
    });
  });
  describe("syncGame", () => {
    const baseGame = {
      id: "1",
      seed: 123456,
      name: "Ahri",
      guessed: false,
      triedWords: ["a"],
      synonymsOfTriedWord: [{ triedWord: "a", synonyms: ["x"] }],
      verbsOfTriedWord: [{ triedWord: "a", allFormOfVerb: ["y"] }],
    };

    it("should throw BadRequestError on invalid IDs", async () => {
      await expect(gameService.syncGame("bad", "bad")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw NotFoundError if existingGame not found", async () => {
      (repo.getDailyGame as jest.Mock).mockImplementationOnce(() => null);
      await expect(
        gameService.syncGame(
          new ObjectId().toString(),
          new ObjectId().toString()
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if incomingGame not found", async () => {
      const id = new ObjectId().toString();
      (repo.getDailyGame as jest.Mock)
        .mockResolvedValueOnce(baseGame)
        .mockResolvedValueOnce(null);
      await expect(gameService.syncGame(id, id)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotModifiedError if existing game already guessed", async () => {
      const guessedGame = { ...baseGame, guessed: true };
      (repo.getDailyGame as jest.Mock)
        .mockResolvedValueOnce(guessedGame)
        .mockResolvedValueOnce(baseGame);
      await expect(
        gameService.syncGame(
          new ObjectId().toString(),
          new ObjectId().toString()
        )
      ).rejects.toThrow(NotModifiedError);
    });

    it("should throw BadRequestError if seeds mismatch", async () => {
      const game1 = { ...baseGame };
      const game2 = { ...baseGame, seed: 999999 };
      (repo.getDailyGame as jest.Mock)
        .mockResolvedValueOnce(game1)
        .mockResolvedValueOnce(game2);
      await expect(
        gameService.syncGame(
          new ObjectId().toString(),
          new ObjectId().toString()
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should merge games and mark guessed if incoming guessed", async () => {
      const existingGame = { ...baseGame };
      const incomingGame = {
        ...baseGame,
        guessed: true,
        triedWords: ["b"],
        synonymsOfTriedWord: [{ triedWord: "b", synonyms: ["z"] }],
        verbsOfTriedWord: [{ triedWord: "b", allFormOfVerb: ["v"] }],
      };

      (repo.getDailyGame as jest.Mock)
        .mockResolvedValueOnce(existingGame)
        .mockResolvedValueOnce(incomingGame);
      (repo.incFindedCountToHistoryRecord as jest.Mock).mockResolvedValue(1);
      (repo.saveDailyGame as jest.Mock).mockResolvedValue(1);

      const result = await gameService.syncGame(
        new ObjectId().toString(),
        new ObjectId().toString()
      );
      const g = result as any;

      expect(g.guessed).toBe(true);
      expect(g.triedWords).toEqual(expect.arrayContaining(["a", "b"]));
      expect(g.synonymsOfTriedWord).toEqual(
        expect.arrayContaining([
          { triedWord: "a", synonyms: ["x"] },
          { triedWord: "b", synonyms: ["z"] },
        ])
      );
      expect(g.verbsOfTriedWord).toEqual(
        expect.arrayContaining([
          { triedWord: "a", allFormOfVerb: ["y"] },
          { triedWord: "b", allFormOfVerb: ["v"] },
        ])
      );
    });
  });
});
