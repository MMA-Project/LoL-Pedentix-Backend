import { MongoClient } from "mongodb";
import GameDBO from "../dbo/Game.dbo";

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB;

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is not defined");
  process.exit(1);
}
if (!MONGO_DB) {
  console.error("MONGO_DB environment variable is not defined");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI);

(async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
})();

const db = client.db(MONGO_DB);

export const championsCollection = db.collection("champions");
export const gamesCollection = db.collection<GameDBO>("games");
