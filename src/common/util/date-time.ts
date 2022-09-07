import type {
  CurrentTimeMs,
  ConvertDuration,
  IsValidUnixMsTimestamp,
  CreationAndModificationTimestampsValidator,
} from "common/interfaces/date-time";

import { is } from "handy-types";
import EPP from "./epp";

export const currentTimeMs: CurrentTimeMs = function _currentTimeMs() {
  return Date.now();
};

export const isValidUnixMsTimestamp: IsValidUnixMsTimestamp =
  function _isValidUnixMsTimestamp(timestamp): timestamp is number {
    return is<number>("non_negative_integer", timestamp);
  };

interface MakeTimestampValidatorArgument {
  getNewTimestamp(): number;
  isValidTimestamp(timestamp: number): timestamp is number;
}

export function makeTimestampsValidator(
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

const msPerUnit = Object.freeze({
  ms: 1,
  s: 1000,
  m: 60000,
  h: 3600000,
  second: 1000,
  hour: 3600000,
  minute: 60000,
  millisecond: 1,
});

export const convertDuration: ConvertDuration = function _convertDuration(arg) {
  const { fromUnit, toUnit, duration } = arg;

  const durationMS = duration * msPerUnit[fromUnit];
  return durationMS / msPerUnit[toUnit];
};
