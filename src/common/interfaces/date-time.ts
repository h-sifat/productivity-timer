export interface CurrentTimeMs {
  (): number;
}

export interface IsValidUnixMsTimestamp {
  (timestamp: number): timestamp is number;
}

interface TimestampValidatorArgument {
  creationTimestampPropName?: string;
  modificationTimestampPropName?: string;
  objectContainingTimestamps: object;
}

interface TimestampValidationResult {
  createdOn: number;
  modifiedOn: number;
}

export interface CreationAndModificationTimestampsValidator {
  (arg: TimestampValidatorArgument): TimestampValidationResult;
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
