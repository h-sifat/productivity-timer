export interface CurrentTimeMs {
  (): number;
}

export interface IsValidUnixMsTimestamp {
  (timestamp: unknown): timestamp is number;
}

export interface AssertValidUnixMsTimestamp {
  (timestamp: unknown, errorCode?: string): asserts timestamp is number;
}

interface Timestamps {
  createdOn: number;
  modifiedOn: number;
}

export interface AssertValidTimestamps {
  (arg: { [k in keyof Timestamps]: any }): asserts arg is Timestamps;
}

export interface AssertValidUSLocaleDateString {
  (date: unknown): asserts date is string;
}

export type DurationUnit =
  | "h"
  | "m"
  | "s"
  | "ms"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

interface ConvertDurationArgument {
  duration: number;
  toUnit: DurationUnit;
  fromUnit: DurationUnit;
}
export type ConvertDuration = (arg: ConvertDurationArgument) => number;
