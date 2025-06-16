import { ObjectId, WithId } from "mongodb";
import HistoryRecord from "../../service/models/History";

export interface HistoryRecordDBO {
  _id: ObjectId;
  seed: number;
  name: string;
  findedCount: number;
}

export const HistoryRecordDBOToModel = (
  record: WithId<HistoryRecordDBO>
): HistoryRecord => {
  return {
    seed: record.seed,
    name: record.name,
    findedCount: record.findedCount,
  };
};

export const HistoryRecordModelToDBO = (
  record: HistoryRecord
): WithId<HistoryRecordDBO> => {
  return {
    _id: new ObjectId(),
    seed: record.seed,
    name: record.name,
    findedCount: record.findedCount,
  };
};
