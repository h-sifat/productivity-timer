import { assertValidString } from "common/validator/string";

describe("Type Validation", () => {
  it.each([
    {
      string: 2342,
      otherInfo: { name: "city" },
      errorCode: "INVALID_CITY",
    },
    {
      string: 2342,
      otherInfo: { name: "city", typeErrorCode: "NOT_A_STRING" },
      errorCode: "NOT_A_STRING",
    },
    {
      string: "",
      otherInfo: { name: "city", minLength: 1 },
      errorCode: "CITY_TOO_SHORT",
    },
    {
      string: "abcd",
      otherInfo: { name: "city", maxLength: 3 },
      errorCode: "CITY_TOO_LONG",
    },
    {
      string: "",
      otherInfo: {
        name: "city",
        minLength: 1,
        minLengthErrorCode: "CITY_NAME_TOO_SHORT",
      },
      errorCode: "CITY_NAME_TOO_SHORT",
    },
    {
      string: "abcd",
      otherInfo: {
        name: "city",
        maxLength: 3,
        maxLengthErrorCode: "CITY_NAME_TOO_LONG",
      },
      errorCode: "CITY_NAME_TOO_LONG",
    },
    {
      string: "",
      otherInfo: {
        name: "city",
        minLength: 5,
        maxLength: 2,
      },
      errorCode: "MIN_LENGTH_GREATER_THAN_MAX_LENGTH",
    },
  ])(
    // ewc = error with code
    `throws ewc "$errorCode" if string = $string and otherInfo = $otherInfo`,
    ({ string, otherInfo, errorCode }) => {
      expect(() => {
        // @ts-ignore
        assertValidString(string, otherInfo);
      }).toThrowErrorWithCode(errorCode);
    }
  );

  it.each([
    {
      string: "a",
      otherInfo: { name: "city" },
    },

    {
      string: "a",
      otherInfo: { name: "city", minLength: 1 },
    },
    {
      string: "abcd",
      otherInfo: { name: "city", maxLength: 5 },
    },
    {
      string: "abc",
      otherInfo: {
        name: "city",
        minLength: 2,
        maxLength: 5,
      },
    },
    {
      string: "abc",
      otherInfo: {
        name: "city",
        minLength: 3,
        maxLength: 3,
      },
    },
  ])(
    // ewc = error with code
    `doesn't throws error if string = $string and otherInfo = $otherInfo`,
    ({ string, otherInfo }) => {
      expect(() => {
        // @ts-ignore
        assertValidString(string, otherInfo);
      }).not.toThrow();
    }
  );
});
