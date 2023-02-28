import {
  assertValidUSLocaleDateString,
  currentTimeMs,
  formatDurationMsAsHMS,
  isValidUnixMsTimestamp,
  MS_IN_ONE_HOUR,
  MS_IN_ONE_MINUTE,
  parseDuration,
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

describe("formatDurationMsAsHMS", () => {
  const clockFormatArg = Object.freeze({
    separator: ":",
    showUnit: false,
    padWithZero: true,
    filterZeroValues: false,
  });

  it.each([
    {
      arg: {
        duration: 1000,
        separator: " ",
        showUnit: true,
        padWithZero: true,
        filterZeroValues: false,
      },
      expected: "00h 00m 01s",
    },
    {
      arg: {
        duration: 1000,
        separator: " ",
        showUnit: true,
        padWithZero: true,
        filterZeroValues: true,
      },
      expected: "01s",
    },
    {
      arg: {
        duration: 1000,
        separator: " ",
        showUnit: true,
        padWithZero: false,
        filterZeroValues: false,
      },
      expected: "0h 0m 1s",
    },
    {
      arg: {
        duration: 1000,
        separator: ":",
        showUnit: false,
        padWithZero: false,
        filterZeroValues: false,
      },
      expected: "0:0:1",
    },
    {
      expected: "00:01:01",
      arg: { duration: MS_IN_ONE_MINUTE + 1000, ...clockFormatArg },
    },
    {
      expected: "10:01:01",
      arg: {
        duration: 10 * MS_IN_ONE_HOUR + MS_IN_ONE_MINUTE + 1000,
        ...clockFormatArg,
      },
    },
  ])(`format($arg) => "$expected"`, ({ arg, expected }) => {
    expect(formatDurationMsAsHMS(arg)).toBe(expected);
  });
});

describe("parseDuration", () => {
  describe("Validation", () => {
    it.each(["20x", "1m20h", "1s2m", "1s2h", "234.234m", "-23m2s"])(
      `invalid duration string: %p`,
      (durationString) => {
        expect(() => {
          parseDuration(durationString);
        }).toThrow(Error);
      }
    );
  });

  describe("Functionality", () => {
    it.each([
      { durationString: "20m", output: 20 * MS_IN_ONE_MINUTE },
      { durationString: "20m1s", output: 20 * MS_IN_ONE_MINUTE + 1000 },
      {
        durationString: "1h20m1s",
        output: MS_IN_ONE_HOUR + 20 * MS_IN_ONE_MINUTE + 1000,
      },
      { durationString: "1h1s", output: MS_IN_ONE_HOUR + 1000 },
      { durationString: "1s", output: 1000 },
      { durationString: "1h", output: MS_IN_ONE_HOUR },
      { durationString: "1m", output: MS_IN_ONE_MINUTE },
    ])(
      `parseDuration("$durationString") => $output`,
      ({ durationString, output }) => {
        expect(parseDuration(durationString)).toBe(output);
      }
    );
  });
});
