import { assert } from "handy-types";
import { convertDuration } from "common/util/date-time";
import { InvalidArgumentError, Option } from "commander";

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
