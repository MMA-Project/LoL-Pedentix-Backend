import BadRequestError from "../../errors/BadRequest.error";
import NotFoundError from "../../errors/NotFound.error";
import HistoryRecord from "../models/History";
import { getDailySeed } from "../../utils/seed";
import {
  clearOldDailyGames,
  createHistoryRecord,
  getAllChampions,
  getChampion,
} from "../../repository/game.repository";
import cron from "node-cron";
import { add } from "cheerio/dist/commonjs/api/traversing";
import { randomInt } from "crypto";

export async function initGameCron() {
  cron.schedule("0 0 * * *", async () => {
    await gameCron();
  });
  await gameCron();
}

export async function gameCron() {
  await clearOldDailyGames();
  console.log("Old daily games cleared at midnight.");
  const todaySeed = getDailySeed();
  console.log(`Today's seed is: ${todaySeed}`);

  const champions = await getAllChampions();
  const champion =
    champions[(todaySeed * randomInt(0, champions.length)) % champions.length];
  await addNewRecordToDailyHistory({
    seed: todaySeed,
    name: champion.name,
    findedCount: 0,
  });
  console.log(`New daily history record added for champion: ${champion.name}`);
  console.log("Daily game cron job completed successfully.");
}

export const addNewRecordToDailyHistory = async (
  historyRecord: HistoryRecord
): Promise<void> => {
  const createdId = await createHistoryRecord(historyRecord);
  if (!createdId) {
    throw new Error("Failed to create history record");
  }
};
