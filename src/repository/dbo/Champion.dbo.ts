import { ObjectId, WithId } from "mongodb";
import { Champion } from "../../service/models/Champion";

export interface ChampionDBO {
  _id: ObjectId;
  name: string;
  image: string;
  text: string;
}

export const ChampionDBOToModel = (champion: WithId<ChampionDBO>): Champion => {
  return {
    name: champion.name,
    image: champion.image,
    text: champion.text,
  };
};
