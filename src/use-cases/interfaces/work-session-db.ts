import type { ReadonlyDeep } from "type-fest";
import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

export interface QueryMethodArguments {
  insert: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>;
  findByDateRange: { from: string; to: string };
}

export interface DailyStat {
  date: number;
  totalDurationMs: number;
  durationPerRefs: { duration: number; ref: TimerRefWithName }[];
}
export type StatisticsInterface = DailyStat[];

export default interface WorkSessionDatabaseInterface {
  getMaxId(): Promise<number>;
  findByDateRange(
    arg: QueryMethodArguments["findByDateRange"]
  ): Promise<WorkSessionFields<TimerRefWithName>[]>;
  getStats: () => Promise<ReadonlyDeep<StatisticsInterface>>;
  insert(arg: QueryMethodArguments["insert"]): Promise<void>;
}
