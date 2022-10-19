import { TimerRef } from "entities/work-session/work-session";

export interface WorkSessionRecordEvents {
  timestamp: number;
  name: "s" | "p" | "e" | "t";
}

export type WorkSessionJSONRecord = {
  id: number;
  startedAt: number;
  targetDuration: number;
  events: WorkSessionRecordEvents[];
  ref: Omit<TimerRef, "id"> & { id: number };
  elapsedTime: { total: number; byDate: [number, number][] };
};

export type WorkSessionCategoryAndProjectIds =
  | { categoryId: null; projectId: number }
  | { categoryId: number; projectId: null };

export type WorkSessionTableRecord = Pick<
  WorkSessionJSONRecord,
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
