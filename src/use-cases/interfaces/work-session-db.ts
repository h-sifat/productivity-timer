import type { ReadonlyDeep } from "type-fest";
import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { WorkSessionFields } from "entities/work-session/work-session";

export interface QueryMethodArguments {
  insert: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>;
  findByDateRange: { from: string; to: string };
}

export interface DailyStat {
  date: number;
  totalDurationMs: number;
  durationPerRefs: {
    duration: number;
    ref: { id: string; type: "project" | "category" };
  }[];
}
export type StatisticsInterface = DailyStat[];

export default interface WorkSessionDatabaseInterface {
  getMaxId(): Promise<number>;
  findByDateRange(
    arg: QueryMethodArguments["findByDateRange"]
  ): Promise<WorkSessionFields[]>;
  getStats: () => Promise<ReadonlyDeep<StatisticsInterface>>;
  insert(arg: QueryMethodArguments["insert"]): Promise<void>;
}
