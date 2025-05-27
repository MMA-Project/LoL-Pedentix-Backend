import { clearOldGames } from "../game.repository";
import cron from "node-cron";

export async function initGameCron() {
  cron.schedule("0 0 * * *", async () => {
    await clearOldGames();
    console.log("Old games cleared at midnight.");
  });
  await clearOldGames();
}
