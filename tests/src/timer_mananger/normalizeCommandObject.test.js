const normalizeCommandObject = require("../../../src/timer_manager/normalizeCommandObject");
const { EPP } = require("../../../src/util");

const commandAliases = Object.freeze({
  st: "START",
  lst: "LIST_SAVED_TIMERS",
  tt: "TEST",
});

const allCommands = Object.freeze([
  "START",
  "LIST_SAVED_TIMERS",
  "STATS",
  "TEST",
  "SAVE",
]);

const allCommandSchemas = Object.freeze({
  LIST_SAVED_TIMERS: {},
  START: {
    arguments: {
      count: 1,
      optional: 1,
    },
  },
  TEST: {
    arguments: {
      count: 2,
      optional: 1,
    },
  },
  SAVE: {
    options: {
      name: { type: "string" },
      unit: { type: "string", default: "minute" },
      duration: {
        type: "string",
        apply: (durationString) => {
          const duration = Number(durationString);
          console.log("here");
          if (Number.isNaN(duration))
            throw new EPP(
              `Invalid duration "${durationString}"`,
              "INVALID_DURATION"
            );
          return duration;
        },
      },
      description: { type: "string", optional: true },
      tags: { type: "array" },
    },
    optionAbbreviations: {
      n: "name",
      u: "unit",
      d: "duration",
      D: "description",
      t: "tags",
    },
    arguments: { count: 0 },
  },
});

describe("Error Handling", () => {
  it.each([
    {
      case: "if commandObject is not a plain object",
      commandObject: null,
      errorCode: "NOT_PLAIN_OBJECT",
    },
    {
      case: "if command property is absent",
      commandObject: { options: {} },
      errorCode: "MISSING_PROPERTY",
    },
    {
      case: "if options property is absent",
      commandObject: { command: "start" },
      errorCode: "MISSING_PROPERTY",
    },
    {
      case: "if command is not a non empty string",
      commandObject: { command: "", options: {} },
      errorCode: "INVALID_COMMAND",
    },
    {
      case: "if options is not a plain object",
      commandObject: {
        command: "start",
        options: ["not_plain_object"],
      },
      errorCode: "INVALID_ARGUMENTS",
    },
    {
      case: "if command is not found",
      commandObject: { command: "duck", options: { a: 1 } },
      errorCode: "UNKNOWN_COMMAND",
    },
    {
      case: "if arguments is not an array of string",
      commandObject: {
        command: "start",
        options: { a: 1 },
        arguments: "not_an_array",
      },
      errorCode: "INVALID_MAIN_ARGUMENTS",
    },
    {
      case: "if arguments is not an array of string",
      commandObject: {
        command: "start",
        options: {},
        arguments: ["A", "b", 3],
      },
      errorCode: "INVALID_MAIN_ARGUMENTS",
    },
    {
      case: "if arguments required but absent",
      commandObject: {
        command: "TEST", // the test command requires at least 1 main argument. see the schema
        options: {},
      },
      errorCode: "MISSING_REQUIRED_MAIN_ARGUMENT(S)",
    },
    {
      case: "if arguments required but absent",
      commandObject: {
        command: "TEST", // the test command requires at least 1 main argument. see the schema
        options: {},
        arguments: [],
      },
      errorCode: "MISSING_REQUIRED_MAIN_ARGUMENT(S)",
    },
  ])(`throws error ($errorCode) $case`, ({ commandObject, errorCode }) => {
    expect.assertions(1);
    try {
      normalizeCommandObject({
        allCommands,
        commandObject,
        commandAliases,
        allCommandSchemas,
      });
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }
  });
});

describe("Functionality", () => {
  const teatData = Object.freeze([
    {
      commandObject: { command: "LIST_SAVED_TIMERS", options: {} },
      expectedOutput: { command: "LIST_SAVED_TIMERS" },
    },
    {
      commandObject: { command: "START", options: {} },
      expectedOutput: { command: "START" },
    },
    {
      commandObject: {
        command: "START",
        options: {},
        arguments: ["coding"],
      },
      expectedOutput: { command: "START", argument: "coding" },
    },

    {
      commandObject: {
        command: "tt",
        options: {},
        arguments: ["arg_a", "arg_b"],
      },
      expectedOutput: { command: "TEST", argument: ["arg_a", "arg_b"] },
    },
    {
      commandObject: { command: "SAVE", options: {} },
      expectedOutput: { command: "SAVE" },
    },
    {
      commandObject: {
        command: "SAVE",
        options: {
          name: ["coding"],
          d: ["20"],
          D: ["Crazy activity"],
          t: ["work", "coding"],
        },
      },
      expectedOutput: {
        command: "SAVE",
        argument: {
          name: "coding",
          duration: 20,
          description: "Crazy activity",
          unit: "minute", // default
          tags: ["work", "coding"],
        },
      },
    },
  ]);

  teatData.forEach(({ commandObject, expectedOutput }, index) => {
    it(`returns ${JSON.stringify(expectedOutput)} for input: ${JSON.stringify(
      commandObject
    )}. idx: ${index}`, () => {
      const normalizedCommandObject = normalizeCommandObject({
        allCommands,
        commandObject,
        commandAliases,
        allCommandSchemas,
      });

      expect(normalizedCommandObject).toEqual(expectedOutput);
    });
  });
});
