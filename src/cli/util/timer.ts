import { assert } from "handy-types";
import { printObjectAsBox } from "./box";
import { TimeInfo } from "src/countdown-timer/type";
import { convertDuration } from "common/util/date-time";
import { InvalidArgumentError, Option } from "commander";
import { TimerStateNames } from "src/countdown-timer/timer";
import { TimerRefWithName } from "src/controllers/timer/interface";

const ONE_MINUTE_MS = convertDuration({
  duration: 1,
  fromUnit: "minute",
  toUnit: "millisecond",
});

export const DurationOption = new Option(
  "-d, --duration <number>{s|m|h}",
  "specifies the timer duration. e.g., 10m, 1h etc."
).argParser(durationParser);

function durationParser(value: any) {
  const durationWithUnit = String(value);

  if (!/^\d+[hms]$/.test(durationWithUnit))
    throw new InvalidArgumentError(
      "Invalid duration. Valid examples: 1h, 20m, 50s etc."
    );

  const unit = durationWithUnit.slice(-1) as "h" | "m" | "s";
  const duration = Number(durationWithUnit.slice(0, -1));

  assert<number>("positive_integer", duration, {
    name: "duration",
  });

  return convertDuration({ duration, fromUnit: unit, toUnit: "millisecond" });
}

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
