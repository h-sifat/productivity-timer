import CreationAndModificationTimestampsValidator from "common/interfaces/timestamp-validator";

import EPP from "./epp";

interface MakeTimestampValidatorArgument {
  getNewTimestamp(): number;
  isValidTimestamp(timestamp: number): timestamp is number;
}

export default function makeTimestampsValidator(
  arg: MakeTimestampValidatorArgument
): CreationAndModificationTimestampsValidator {
  const { getNewTimestamp, isValidTimestamp } = arg;

  return function validateTimestamps(arg) {
    const {
      objectContainingTimestamps,
      creationTimestampPropName = "createdOn",
      modificationTimestampPropName = "modifiedOn",
    } = arg;

    {
      const onlyOneTimestampIsPresent =
        +(creationTimestampPropName in objectContainingTimestamps) ^
        +(modificationTimestampPropName in objectContainingTimestamps);

      if (onlyOneTimestampIsPresent)
        throw new EPP({
          code: "MISSING_ANOTHER_TIMESTAMP",
          message:
            "Creation and Modification timestamps must be provided together.",
        });
    }

    let createdOn: number, modifiedOn: number;

    // ------ createdOn ----
    if (creationTimestampPropName in objectContainingTimestamps) {
      const _createdOn = (objectContainingTimestamps as any)[
        creationTimestampPropName
      ];

      if (!isValidTimestamp(_createdOn))
        throw new EPP({
          code: "INVALID_CREATION_TIMESTAMP",
          message: `Invalid timestamp createdOn: ${_createdOn}`,
        });

      createdOn = _createdOn;
    } else createdOn = getNewTimestamp();

    // ------ modifiedOn ------
    if (creationTimestampPropName in objectContainingTimestamps) {
      const _modifiedOn = (objectContainingTimestamps as any)[
        modificationTimestampPropName
      ];

      if (!isValidTimestamp(_modifiedOn))
        throw new EPP({
          code: "INVALID_MODIFICATION_TIMESTAMP",
          message: `Invalid timestamp ${modificationTimestampPropName}: ${_modifiedOn}`,
        });

      modifiedOn = _modifiedOn;
    } else modifiedOn = createdOn;

    if (modifiedOn < createdOn)
      throw new EPP({
        code: "MODIFIED_BEFORE_CREATED",
        message: `Modified before creation! Huh? Error: ${modificationTimestampPropName} < ${creationTimestampPropName}.`,
      });

    return { createdOn, modifiedOn };
  };
}
