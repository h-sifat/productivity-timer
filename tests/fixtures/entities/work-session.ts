import { DeepFreezeTypeMapper } from "common/interfaces/other";
import { WorkSessionFields } from "entities/work-session/work-session";

export const SAMPLE_WORK_SESSION: DeepFreezeTypeMapper<WorkSessionFields> =
  Object.freeze({
    id: "1",
    startedAt: "10/17/2022",
    targetDuration: 30000,
    elapsedTime: Object.freeze({
      total: 27000,
      byDate: { "10/17/2022": 27000 },
    }),
    events: Object.freeze(
      (
        [
          { name: "start", timestamp: 1665974432861 },
          { name: "pause", timestamp: 1665974445665 },
          { name: "start", timestamp: 1665974474171 },
          { name: "end_manually", timestamp: 1665974490051 },
        ] as const
      ).map((e) => Object.freeze(e))
    ),
    ref: Object.freeze({ type: "category", id: "1" } as const),
  });
