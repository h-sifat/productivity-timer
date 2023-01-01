import { Option } from "commander";
import { durationParser } from "cli/util";

export const DurationOption = new Option(
  "-d, --duration <number>{s|m|h}",
  "specifies the timer duration. e.g., 10m, 1h etc."
).argParser(durationParser);
