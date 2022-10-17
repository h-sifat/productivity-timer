import { TimerRef } from "entities/work-session/work-session";

export interface WorkSessionRecordEvents {
  timestamp: number;
  name: "s" | "p" | "e" | "t";
}

export type WorkSessionRecord = {
  id: number;
  startedAt: number;
  targetDuration: number;
  events: WorkSessionRecordEvents[];
  ref: Omit<TimerRef, "id"> & { id: number };
  elapsedTime: { total: number; byDate: [number, number][] };
};
