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
