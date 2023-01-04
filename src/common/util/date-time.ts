import type {
  CurrentTimeMs,
  ConvertDuration,
  AssertValidTimestamps,
  IsValidUnixMsTimestamp,
  AssertValidUnixMsTimestamp,
  AssertValidUSLocaleDateString,
  UnixMsTimestampToUsLocaleDateString,
} from "common/interfaces/date-time";

import { assert, is } from "handy-types";
import EPP from "./epp";

export const currentTimeMs: CurrentTimeMs = function _currentTimeMs() {
  return Date.now();
};

export const isValidUnixMsTimestamp: IsValidUnixMsTimestamp =
  function _isValidUnixMsTimestamp(timestamp): timestamp is number {
    return is<number>("non_negative_integer", timestamp);
  };

export const assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp =
  function _assertValidUnixMsTimestamp(
    timestamp,
    errorCode = "INVALID_TIMESTAMP"
  ) {
    if (!isValidUnixMsTimestamp(timestamp))
      throw new EPP({
        code: errorCode,
        message: `Invalid unix millisecond timestamp: ${timestamp}`,
      });
  };

export const assertValidTimestamps: AssertValidTimestamps =
  function _validateTimestamps(arg) {
    const { createdOn, modifiedOn } = arg;

    if (!isValidUnixMsTimestamp(createdOn))
      throw new EPP({
        code: "INVALID_CREATION_TIMESTAMP",
        message: `Invalid timestamp createdOn: ${createdOn}`,
      });

    if (!isValidUnixMsTimestamp(modifiedOn))
      throw new EPP({
        code: "INVALID_MODIFICATION_TIMESTAMP",
        message: `Invalid timestamp modifiedOn: ${modifiedOn}`,
      });

    if (modifiedOn < createdOn)
      throw new EPP({
        code: "MODIFIED_BEFORE_CREATED",
        message: `Modified before creation! Huh? Error: modifiedOn < createdOn.`,
      });
  };

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

const VALID_DATE_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
export const assertValidUSLocaleDateString: AssertValidUSLocaleDateString =
  function _assertValidUSLocaleDateString(
    date: unknown,
    errorCode = "INVALID_DATE_STRING"
  ): asserts date is string {
    assert<string>("non_empty_string", date, {
      name: "Date",
      code: errorCode,
    });

    const isInvalidDate =
      !VALID_DATE_PATTERN.test(date) || Number.isNaN(+new Date(date));

    if (isInvalidDate)
      throw new EPP({
        code: errorCode,
        message: `Invalid date (us-locale: mm/dd/yyyy) string: "${date}"`,
      });
  };

export const unixMsTimestampToUsLocaleDateString: UnixMsTimestampToUsLocaleDateString =
  function _unixMsTimestampToUsLocaleDateString(timestamp) {
    assertValidUnixMsTimestamp(timestamp);
    return new Date(timestamp).toLocaleDateString("en-US");
  };

export const MS_IN_ONE_MINUTE = 60_000;
export const MS_IN_ONE_HOUR = 60 * MS_IN_ONE_MINUTE;
