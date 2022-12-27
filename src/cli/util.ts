import { InvalidArgumentError } from "commander";

export function durationParser(value: any) {
  if (!/^\d+[hms]$/.test(String(value)))
    throw new InvalidArgumentError(
      "Invalid duration. Valid examples: 1h, 20m, 50s etc."
    );

  return "parsed duration";
}
