import { printObjectAsBox } from "./box";
import { TimeInfo } from "src/countdown-timer/type";
import { InvalidArgumentError, Option } from "commander";
import { TimerStateNames } from "src/countdown-timer/timer";
import { TimerRefWithName } from "src/controllers/timer/interface";
import { convertDuration, parseDuration } from "common/util/date-time";

const ONE_MINUTE_MS = convertDuration({
  duration: 1,
  fromUnit: "minute",
  toUnit: "millisecond",
});

export function parseCliDurationArg(durationString: string): number {
  try {
    const duration = parseDuration(durationString);
    if (!duration)
      throw new InvalidArgumentError("Timer duration must be non-zero!");
    return duration;
  } catch (ex) {
    throw new InvalidArgumentError(ex.message);
  }
}

export const durationOptionDescription =
  "timer duration. e.g., 10s, 10m, 1h, 1h20m, 20m20s, 1h20m2s etc.";
export const DurationOption = new Option(
  "-d, --duration <duration-string>",
  durationOptionDescription
).argParser(parseCliDurationArg);

export interface printTimer_Arg {
  message?: string;
  state: TimerStateNames;
  ref: TimerRefWithName | null;
  timeInfo: TimeInfo<TimerRefWithName>;
}

export function printTimerMethodCallResult(arg: printTimer_Arg) {
  const { ref, state } = arg;

  const title = `[${ref?.name || "Anonymous"}]`;
  const { duration, elapsedTime } = arg.timeInfo;

  const info: any = {
    state: state,
    duration: formatDuration(duration),
    "elapsed time": formatDuration(elapsedTime.total),
  };

  if (ref) {
    info.id = ref.id;
    info.type = ref.type;
  }

  if (arg.message) console.log(arg.message);
  printObjectAsBox({ object: info, title, useColors: false });
}

export function formatDuration(duration: number) {
  const fromUnit = "ms";
  const toUnit = duration < ONE_MINUTE_MS ? "s" : "m";

  const converted = convertDuration({ duration, fromUnit, toUnit });
  return `${Math.floor(converted)}${toUnit}`;
}
