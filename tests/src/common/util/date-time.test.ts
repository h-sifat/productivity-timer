import {
  assertValidUSLocaleDateString,
  currentTimeMs,
  isValidUnixMsTimestamp,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";

describe("currentTimeMs", () => {
  it("returns a positive integer", () => {
    const now = currentTimeMs();

    expect(Number.isInteger(now)).toBeTruthy();
    expect(now).toBeGreaterThan(-1);
  });
});

describe("isValidUnixMsTimestamp", () => {
  it.each([
    {
      timestamp: -1,
      isValid: false,
      case: "not a non_negative_integer",
    },
    {
      timestamp: 12.123,
      isValid: false,
      case: "not a non_negative_integer",
    },
    {
      timestamp: "12",
      isValid: false,
      case: "not a non_negative_integer",
    },
    {
      timestamp: 0,
      isValid: true,
      case: "a non_negative_integer",
    },
  ])(
    `returns $isValid if timestamp ($timestamp) is $case`,
    ({ timestamp, isValid }) => {
      // @ts-ignore
      expect(isValidUnixMsTimestamp(timestamp)).toBe(isValid);
    }
  );
});

describe("assertValidUSLocaleDateString", () => {
  it.each([null, "234", "2022/01/01", "24/22/2022"])(
    `throws error if date is %p`,
    (date) => {
      expect(() => {
        // @ts-ignore
        assertValidUSLocaleDateString(date);
      }).toThrowErrorWithCode("INVALID_DATE_STRING");
    }
  );

  it(`doesn't throw error if date is valid`, () => {
    expect(() => {
      assertValidUSLocaleDateString("01/01/2022");
    }).not.toThrow();
  });
});

describe("unixMsTimestampToUsLocaleDateString", () => {
  it(`throws error if timestamp is not valid`, () => {
    expect(() => {
      unixMsTimestampToUsLocaleDateString(23423.23423);
    }).toThrowErrorWithCode("INVALID_TIMESTAMP");
  });

  it(`converts a unix ms timestamp to a US locale date string`, () => {
    const date = new Date();
    expect(unixMsTimestampToUsLocaleDateString(+date)).toBe(
      date.toLocaleDateString("en-US")
    );
  });
});
