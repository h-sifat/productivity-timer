import type { AssertValidString } from "common/interfaces/validator";

import EPP from "common/util/epp";
import { assert } from "handy-types";

export const assertValidString: AssertValidString = function _assertValidString(
  string,
  otherInfo
): asserts string is string {
  const { name, trimBeforeLengthValidation = false } = otherInfo;

  {
    const code =
      "typeErrorCode" in otherInfo
        ? otherInfo.typeErrorCode
        : `INVALID_${name.toUpperCase()}`;

    assert<string>("string", string, { name, code });
  }

  if (trimBeforeLengthValidation) string = string.trim();

  {
    const isMinLengthGreaterThanMaxLength =
      "maxLength" in otherInfo &&
      "minLength" in otherInfo &&
      otherInfo.minLength > otherInfo.maxLength;

    if (isMinLengthGreaterThanMaxLength)
      throw new EPP({
        code: "MIN_LENGTH_GREATER_THAN_MAX_LENGTH",
        message: "minLength cannot be greater than maxLength",
      });
  }

  if ("maxLength" in otherInfo) {
    const code =
      "maxLengthErrorCode" in otherInfo
        ? otherInfo.maxLengthErrorCode
        : `${name.toUpperCase()}_TOO_LONG`;

    const { maxLength } = otherInfo;

    if (string.length > maxLength)
      throw new EPP({
        code,
        message: `"${name}" cannot be longer than ${maxLength} character(s).`,
      });
  }

  if ("minLength" in otherInfo) {
    const code =
      "minLengthErrorCode" in otherInfo
        ? otherInfo.minLengthErrorCode
        : `${name.toUpperCase()}_TOO_SHORT`;

    const { minLength } = otherInfo;

    if (string.length < minLength)
      throw new EPP({
        code,
        message: `"${name}" cannot be shorter than ${minLength} character(s).`,
      });
  }
};
