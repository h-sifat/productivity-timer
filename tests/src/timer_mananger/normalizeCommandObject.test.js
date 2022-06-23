const normalizeCommandObject = require("../../../src/timer_manager/normalizeCommandObject");
const { EPP } = require("../../../src/util");

const commandAliases = Object.freeze({
  st: "START",
  lst: "LIST_SAVED_TIMERS",
  tt: "TEST",
});

const allCommands = Object.freeze([
  "TEST",
  "SAVE",
  "DUCK",
  "START",
  "STATS",
  "LIST_SAVED_TIMERS",
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
  STATS: {
    arguments: {
      count: 1,
      optional: 1,
      $exec: (argument) =>
        /^\d+$/.test(argument) ? Number(argument) : argument,
    },
  },
  DUCK: {
    arguments: {
      count: 1,
      optional: 1,
      default: "quack",
    },
  },
  SAVE: {
    options: {
      name: { type: "string" },
      unit: { type: "string", default: "minute" },
      duration: {
        type: "string",
        $exec: (durationString) => {
          const duration = Number(durationString);
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
    optionAliases: {
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
      commandObject: null,
      errorCode: "INVALID_COMMAND_OBJECT",
      case: "if commandObject is not a plain object",
    },
    {
      errorCode: "MISSING_PROPERTY",
      commandObject: { options: {} },
      case: "if command property is absent",
    },
    {
      errorCode: "MISSING_PROPERTY",
      commandObject: { command: "start" },
      case: "if options property is absent",
    },
    {
      errorCode: "INVALID_COMMAND",
      commandObject: { command: "", options: {} },
      case: "if command is not a non empty string",
    },
    {
      errorCode: "INVALID_OPTIONS_OBJECT",
      case: "if options is not a plain object",
      commandObject: { command: "start", options: ["not_plain_object"] },
    },
    {
      errorCode: "UNKNOWN_COMMAND",
      case: "if command is not found",
      commandObject: { command: Math.random().toString(), options: { a: 1 } },
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
        options: {},
        command: "start",
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
      expectedOutput: { command: "LIST_SAVED_TIMERS" },
      commandObject: { command: "LIST_SAVED_TIMERS", options: {} },
    },
    {
      expectedOutput: { command: "START" },
      commandObject: { command: "START", options: {} },
    },
    {
      commandObject: {
        options: {},
        command: "START",
        arguments: ["coding"],
      },
      expectedOutput: { command: "START", argument: "coding" },
    },

    {
      commandObject: {
        options: {},
        command: "tt",
        arguments: ["arg_a", "arg_b"],
      },
      expectedOutput: { command: "TEST", argument: ["arg_a", "arg_b"] },
    },
    {
      commandObject: { command: "SAVE", options: {} },
      expectedOutput: { command: "SAVE" },
    },
    {
      commandObject: { command: "STATS", arguments: ["12"], options: {} },
      // the conversion from "12" to 12 is done by the $exec method in the
      // schema of "STATS" command.
      expectedOutput: { command: "STATS", argument: 12 },
    },
    {
      commandObject: { command: "DUCK", options: {}, arguments: [] },
      // the "quack" is a default value coming from the schema.
      expectedOutput: { command: "DUCK", argument: "quack" },
    },
    {
      commandObject: {
        command: "STATS",
        arguments: ["non_numeric_string"],
        options: {},
      },
      expectedOutput: { command: "STATS", argument: "non_numeric_string" },
    },
    {
      commandObject: {
        command: "SAVE",
        options: {
          d: ["20"],
          name: ["coding"],
          D: ["Crazy activity"],
          t: ["work", "coding"],
        },
      },
      expectedOutput: {
        command: "SAVE",
        argument: {
          duration: 20,
          name: "coding",
          tags: ["work", "coding"],
          unit: "minute", // default
          description: "Crazy activity",
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
