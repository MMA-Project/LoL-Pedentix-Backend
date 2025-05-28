import { clearOldDailyGames } from "../game.repository";
import cron from "node-cron";

export async function initGameCron() {
  cron.schedule("0 0 * * *", async () => {
    await clearOldDailyGames();
    console.log("Old daily games cleared at midnight.");
  });
  await clearOldDailyGames();
}
