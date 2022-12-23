import EPP from "common/util/epp";
import { unixMsTimestampToUsLocaleDateString } from "common/util/date-time";

import type { TimerInfo } from "src/countdown-timer/type";
import type { MakeWorkSession_Argument, TimerRef } from "./work-session";

export function convertTimerInfoToMakeWorkSessionArgument(
  timerInfo: TimerInfo<TimerRef>
): MakeWorkSession_Argument {
  const {
    ref,
    elapsedTime,
    logs: events,
    duration: targetDuration,
  } = timerInfo;

  if (!ref)
    throw new EPP({
      code: "INVALID_REF",
      message: `Work Session ref must be non-nullish.`,
    });

  return {
    events,
    elapsedTime,
    targetDuration,
    ref: { id: ref.id, type: ref.type },
    startedAt: unixMsTimestampToUsLocaleDateString(events[0].timestamp),
  };
}
