const { deepFreeze } = require("../util");

const CREATE_COMMAND_OPTION_ALIASES = Object.freeze({
  n: "name",
  u: "unit",
  d: "duration",
  D: "description",
});

const CREATE_COMMAND_OPTIONS = deepFreeze({
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
});

const schema = {
  END: {},
  INFO: {},
  RESET: {},
  PAUSE: {},
  STOP_BEEPING: {},
  UPDATE_CONFIG: {},
  LIST_SAVED_TIMERS: {},
  START: {
    arguments: {
      count: 1,
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
  DELETE_SAVED_TIMER: {
    arguments: {
      count: 1, // increase it later
      optional: 1,
    },
  },
  CREATE: {
    options: CREATE_COMMAND_OPTIONS,
    optionAliases: CREATE_COMMAND_OPTION_ALIASES,
  },
  SAVE: {
    arguments: { count: 0 },
    options: CREATE_COMMAND_OPTIONS,
    optionAliases: CREATE_COMMAND_OPTION_ALIASES,
  },
};

module.exports = deepFreeze(schema);
