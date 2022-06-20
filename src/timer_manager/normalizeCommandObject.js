const { required, assertPlainObject, EPP, exists } = require("../util");

function isArrayOfType({ array, type }) {
  for (const item of array) if (typeof item !== type) return false;
  return true;
}

function normalizeCommandObject(arg) {
  const {
    commandAliases = required("aliases"),
    allCommands = required("allCommands"),
    allCommandSchemas = required("commandSchema"),
    commandObject = required("commandObject"),
  } = arg;

  assertPlainObject({
    object: commandObject,
    name: "commandObject",
    errorCode: "NOT_PLAIN_OBJECT",
  });

  let { command, options, arguments: commandArguments } = commandObject;

  if (!("command" in commandObject) || !("options" in commandObject))
    throw new EPP(
      `The "command" or the "options" property is missing`,
      "MISSING_PROPERTY"
    );

  if (typeof command !== "string" || command === "")
    throw new EPP(
      `The "command" property is missing or invalid.`,
      "INVALID_COMMAND"
    );

  assertPlainObject({
    object: options,
    name: "options",
    errorCode: "INVALID_ARGUMENTS",
  });

  if (
    commandArguments &&
    (!Array.isArray(commandArguments) ||
      !isArrayOfType({ array: commandArguments, type: "string" }))
  )
    throw new EPP(
      `The main arguments of a command must be an array of strings.`,
      "INVALID_MAIN_ARGUMENTS"
    );

  if (command in commandAliases) command = commandAliases[command];
  else if (allCommands.includes(command.toUpperCase()))
    command = command.toUpperCase();
  else throw new EPP(`Unknown command "${command}".`, "UNKNOWN_COMMAND");

  const commandSchema = allCommandSchemas[command];

  if (commandSchema.options && Object.keys(options).length) {
    const { optionAbbreviations = {} } = commandSchema;

    const argument = {};

    for (const [key, value] of Object.entries(options))
      argument[key in optionAbbreviations ? optionAbbreviations[key] : key] =
        value;

    for (const [property, propertySchema] of Object.entries(
      commandSchema.options
    )) {
      const {
        apply,
        type: propertyType,
        optional: isPropertyOptional,
      } = propertySchema;

      if (!(property in argument)) {
        if (propertySchema.default) argument[property] = propertySchema.default;
        else if (!isPropertyOptional)
          throw new EPP(`The property "${property}" is required.`);

        continue;
      }

      let propertyValue = argument[property];

      if (propertyType === "array") {
        if (!Array.isArray(propertyValue))
          // argument[property] = propertyValue;
          // else
          throw new EPP(`The value of "${property}" must be an array.`);
      } else {
        if (property === "duration") console.log("before", propertyValue);

        if (Array.isArray(propertyValue)) propertyValue = propertyValue[0];

        if (property === "duration") console.log(propertyValue);

        if (typeof propertyValue !== propertyType)
          throw new EPP(
            `The property "${property}" must be of type: "${propertyType}"`
          );
      }

      if (apply) propertyValue = apply(propertyValue);

      argument[property] = propertyValue;
    }
    return { command, argument };
  } else if (commandSchema.arguments) {
    const { count, optional = 0 } = commandSchema.arguments;
    const requiredArgumentsCount = count - optional;

    if (!requiredArgumentsCount) {
      if (!commandArguments) return { command };
    } else if (
      !commandArguments ||
      commandArguments.length < requiredArgumentsCount
    ) {
      throw new EPP(
        `The command "${command}" is missing ${requiredArgumentsCount} required main argument(s).`,
        "MISSING_REQUIRED_MAIN_ARGUMENT(S)"
      );
    }

    commandArguments = commandArguments.slice(0, count);
    const argument =
      commandArguments.length === 1 ? commandArguments.pop() : commandArguments;

    return { command, argument };
  } else return { command };
}

module.exports = normalizeCommandObject;
