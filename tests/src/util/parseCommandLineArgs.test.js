const parseCommandLineArgs = require("../../../src/util/parseCommandLineArgs");

describe("parseCommandLineArgs", () => {
  it.each([
    {
      args: null,
      case: "if args is not an array",
      errorCode: "NON_ARRAY_ARGS",
    },
    {
      args: ["a", 1],
      case: "if args is not a string array",
      errorCode: "INVALID_ELEMENT_TYPE",
    },
    {
      args: ["a", ""],
      case: "if args is not a string array",
      errorCode: "INVALID_ELEMENT_TYPE",
    },
    {
      args: ["-a", "1", "-a"],
      case: "if any argument is duplicate",
      errorCode: "DUPLICATE_OPTION",
    },
    {
      args: ["--opt", "--opt"],
      case: "if any argument is duplicate",
      errorCode: "DUPLICATE_OPTION",
    },
  ])(`throws error $case | args: $args`, ({ args, errorCode }) => {
    expect.assertions(1);
    try {
      parseCommandLineArgs(args);
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }
  });

  const testData = [
    { args: ["-a"], output: { options: { a: true } } },
    {
      args: ["-a", "1"],
      output: { options: { a: ["1"] } },
    },
    {
      args: ["-a", "1", "2", "hi"],
      output: { options: { a: ["1", "2", "hi"] } },
    },
    {
      args: ["-a", "1", "-b", "2", "hi"],
      output: { options: { a: ["1"], b: ["2", "hi"] } },
    },
    {
      args: ["-a", "1", "--opt", "2", "hi"],
      output: { options: { a: ["1"], opt: ["2", "hi"] } },
    },
    {
      args: ["-a", "1", "--opt", "2", "hi", "-b", "3", "4"],
      output: { options: { a: ["1"], b: ["3", "4"], opt: ["2", "hi"] } },
    },
    {
      args: ["--", "1", "--", "2"],
      output: { options: {}, mainArguments: ["1", "--", "2"] },
    },

    {
      args: ["-a", "1", "--opt", "2", "hi", "--", "3", "4"],
      output: {
        options: { a: ["1"], opt: ["2", "hi"] },
        mainArguments: ["3", "4"],
      },
    },
    {
      args: ["sub", "1"],
      output: { options: {}, mainArguments: ["sub", "1"] },
    },
    {
      args: ["sub", "-a", "1"],
      output: { options: { a: ["1"] }, mainArguments: ["sub"] },
    },
    {
      args: ["sub", "--opt", "1", "--", "2"],
      output: { options: { opt: ["1"] }, mainArguments: ["sub", "2"] },
    },
    {
      args: ["--opt", "--a", "1"],
      output: { options: { opt: ["--a", "1"] } },
    },
  ].map((item) => {
    if (!item.output.mainArguments) item.output.mainArguments = [];
    return item;
  });

  testData.forEach(({ args, output }) => {
    it(`returns ${JSON.stringify(output)} for input: ${JSON.stringify(
      args
    )}`, () => {
      const argsObject = parseCommandLineArgs(args);
      expect(argsObject).toEqual(output);
    });
  });
});
