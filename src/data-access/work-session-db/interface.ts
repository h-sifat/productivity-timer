import type { TimerRef } from "entities/work-session/work-session";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export interface WorkSessionRecordEvents {
  timestamp: number;
  name: "s" | "p" | "e" | "t";
}

export type WorkSessionOutputJSONRecord = WorkSessionJSONRecord<
  Omit<TimerRefWithName, "id"> & { id: number }
>;

export type WorkSessionInputJSONRecord = WorkSessionJSONRecord<
  Omit<TimerRef, "id"> & { id: number }
>;

type WorkSessionJSONRecord<Ref> = {
  ref: Ref;
  id: number;
  startedAt: number;
  targetDuration: number;
  events: WorkSessionRecordEvents[];
  elapsedTime: { total: number; byDate: [number, number][] };
};

export type WorkSessionCategoryAndProjectIds =
  | { categoryId: null; projectId: number }
  | { categoryId: number; projectId: null };

export type WorkSessionTableRecord = Pick<
  WorkSessionInputJSONRecord,
  "id" | "startedAt" | "targetDuration"
> & { totalElapsedTime: number } & WorkSessionCategoryAndProjectIds;

export interface WorkSessionElapsedTimeByDateRecord {
  date: number;
  elapsed_time_ms: number;
  work_session_id: number;
}

export type WorkSessionTimerEventsRecord = WorkSessionRecordEvents & {
  work_session_id: number;
};
