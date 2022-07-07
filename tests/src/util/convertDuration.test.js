const convertDuration = require("../../../src/util/convertDuration");

describe("Output Test", () => {
  it.each([
    {
      output: 1000,
      input: { duration: 1, fromUnit: "s", toUnit: "ms" },
    },
    {
      output: 1000,
      input: { duration: 1, fromUnit: "second", toUnit: "millisecond" },
    },
    {
      output: 1 / 1000,
      input: { duration: 1, fromUnit: "ms", toUnit: "s" },
    },
    {
      output: 60,
      input: { duration: 1, fromUnit: "h", toUnit: "m" },
    },
    {
      output: 1,
      input: { duration: 60, fromUnit: "m", toUnit: "h" },
    },
    {
      output: 3600,
      input: { duration: 1, fromUnit: "h", toUnit: "s" },
    },
    {
      output: 3600_000,
      input: { duration: 1, fromUnit: "h", toUnit: "ms" },
    },
  ])(
    "returns $output for input $input",
    ({ input, output: expectedOutput }) => {
      const output = convertDuration(input);
      expect(output).toBe(expectedOutput);
    }
  );
});

describe("Validation Test", () => {
  const VALID_INPUT = Object.freeze({
    duration: 1,
    toUnit: "ms",
    fromUnit: "s",
  });

  const omit = (p) => {
    return {
      from(o) {
        const temp = { ...o };
        delete temp[p];
        return temp;
      },
    };
  };

  it.each([
    {
      input: null,
      code: "INVALID_INPUT",
      case: "input is not a non null object",
    },
    {
      code: "MISSING_PROPERTY",
      case: "property duration is missing",
      input: omit("duration").from(VALID_INPUT),
    },
    {
      code: "MISSING_PROPERTY",
      case: "property fromUnit is missing",
      input: omit("fromUnit").from(VALID_INPUT),
    },
    {
      code: "MISSING_PROPERTY",
      case: "property toUnit is missing",
      input: omit("toUnit").from(VALID_INPUT),
    },
    {
      code: "INVALID_DURATION",
      case: "duration is not a positive number",
      input: { ...VALID_INPUT, duration: "not_a_num" },
    },
    {
      code: "INVALID_DURATION",
      case: "duration is not a positive number",
      input: { ...VALID_INPUT, duration: 0 },
    },
    {
      code: "INVALID_DURATION",
      case: "duration is not a positive number",
      input: { ...VALID_INPUT, duration: -1 },
    },
    {
      code: "INVALID_UNIT",
      case: "fromUnit is not a valid unit",
      input: { ...VALID_INPUT, fromUnit: "duck" },
    },
  ])(
    `throws error (with code: "$code") if $case || input: $input`,
    ({ input, code }) => {
      expect.assertions(1);
      try {
        convertDuration(input);
      } catch (ex) {
        expect(ex.code).toBe(code);
      }
    }
  );
});
