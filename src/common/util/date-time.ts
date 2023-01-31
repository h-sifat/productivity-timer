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

/**
 * converts millisecond duration to hh:mm:ss format
 * */
export function formatDurationMsAsHMS(arg: {
  duration: number;
  separator?: string;
}) {
  let { duration } = arg;
  assert<number>("non_negative_integer", duration, {
    name: "duration",
    code: "invalid_duration",
  });

  const formatted = {
    h: "00",
    m: "00",
    s: "00",
  };

  for (const unit of ["h", "m", "s"] as const) {
    const msInUnit = msPerUnit[unit];
    {
      const result = Math.floor(duration / msInUnit);
      formatted[unit] = result < 10 ? `0${result}` : result.toString();
    }

    duration = duration % msInUnit;
  }

  if (arg.separator)
    return [formatted.h, formatted.m, formatted.s].join(arg.separator);

  // e.g 11h 20m 21s
  return `${formatted.h}h ${formatted.m}m ${formatted.s}s`;
}

type shortDurationUnits = "h" | "m" | "s";

const DURATION_PATTERN =
  /(^(\d+h)?(\d+m)?(\d+s)$)|(^(\d+h)?(\d+m)(\d+s)?$)|(^(\d+h)(\d+m)?(\d+s)?$)/i;

/**
 * Converts duration strings like: 1h20m1s, 20m20s, 1h20s etc. to milliseconds.
 * */
export function parseDuration(durationString: string): number {
  if (!DURATION_PATTERN.test(durationString))
    throw new Error(
      `Invalid duration format. Valid examples: 1h20m2s, 2m2s, 2h1m etc.`
    );

  const parsed = { h: 0, m: 0, s: 0 };

  {
    let startIndex = 0;
    for (let index = 0; index < durationString.length; index++) {
      const char = durationString[index];
      if (!"hms".includes(char)) continue;

      parsed[char as shortDurationUnits] = Number(
        durationString.slice(startIndex, index)
      );
      startIndex = index + 1;
    }
  }

  return Object.entries(parsed)
    .map(([fromUnit, duration]) =>
      convertDuration({
        duration,
        toUnit: "millisecond",
        fromUnit: fromUnit as shortDurationUnits,
      })
    )
    .reduce((a, c) => a + c);
}
