import { WorkSessionFields } from "entities/work-session/work-session";

export const SAMPLE_WORK_SESSION: WorkSessionFields = Object.freeze({
  id: "1",
  startedAt: "1/1/1970",
  targetDuration: 10_000,
  elapsedTime: Object.freeze({
    total: 9_000,
    byDate: { "1/1/1970": 9_000 },
  }),
  events: Object.freeze(
    (
      [
        { name: "start", timestamp: 0 },
        { name: "pause", timestamp: 5_000 },
        { name: "start", timestamp: 9_000 },
        { name: "end_manually", timestamp: 13_000 },
      ] as const
    ).map((e) => Object.freeze(e))
  ),
  ref: Object.freeze({ type: "category", id: "1" } as const),
});
