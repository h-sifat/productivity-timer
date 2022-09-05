interface TimestampValidatorArgument {
  creationTimestampPropName?: string;
  modificationTimestampPropName?: string;
  objectContainingTimestamps: object;
}

interface TimestampValidationResult {
  createdOn: number;
  modifiedOn: number;
}

export default interface CreationAndModificationTimestampsValidator {
  (arg: TimestampValidatorArgument): TimestampValidationResult;
}
