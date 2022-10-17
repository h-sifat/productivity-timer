import { deepFreeze } from "common/util/other";
import { DeepFreezeTypeMapper } from "common/interfaces/other";
import { WorkSessionFields } from "entities/work-session/work-session";

export const SAMPLE_WORK_SESSION: DeepFreezeTypeMapper<WorkSessionFields> =
  deepFreeze({
    id: "1",
    startedAt: "10/17/2022",
    targetDuration: 30000,
    elapsedTime: {
      total: 27000,
      byDate: { "10/17/2022": 27000 },
    },
    events: [
      { name: "start", timestamp: 1665974432861 },
      { name: "pause", timestamp: 1665974445665 },
      { name: "start", timestamp: 1665974474171 },
      { name: "end_manually", timestamp: 1665974490051 },
    ],
    ref: { type: "category", id: "1" },
  });
