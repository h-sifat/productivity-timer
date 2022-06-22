const EPP = require("./epp");

const argumentTypes = Object.freeze({
  OPTION: 1,
  MAIN_ARGS_SEPARATOR: 2,
});

const FLAG_PATTERN = /^-([a-zA-Z])$/;
const OPTION_PATTERN = /^--(\w{2,})$/;
const MAIN_ARGS_SEPARATOR = "--";

module.exports = function parseCommandLineArgs(argumentsArray) {
  if (!Array.isArray(argumentsArray))
    throw new EPP(`Argument must be an array.`, "NON_ARRAY_ARGS");

  const options = {};
  const _arguments = [];

  let previousArgumentType;
  let currentOption;

  for (let index = 0; index < argumentsArray.length; index++) {
    const currentArgument = argumentsArray[index];

    if (typeof currentArgument !== "string" || currentArgument === "")
      throw new EPP(
        `All elements of the arguments array must non-empty strings.`,
        "INVALID_ELEMENT_TYPE"
      );

    const matchResult =
      FLAG_PATTERN.exec(currentArgument) ||
      OPTION_PATTERN.exec(currentArgument);

    if (matchResult) {
      const [, option] = matchResult;

      if (option in options)
        throw new EPP(
          `Duplicate option "${currentArgument}".`,
          "DUPLICATE_OPTION"
        );

      currentOption = option;
      previousArgumentType = argumentTypes.OPTION;
      options[option] = true;
    } else if (currentArgument === MAIN_ARGS_SEPARATOR) {
      if (previousArgumentType === argumentTypes.MAIN_ARGS_SEPARATOR)
        _arguments.push(MAIN_ARGS_SEPARATOR);
      else previousArgumentType = argumentTypes.MAIN_ARGS_SEPARATOR;
    } else {
      // change here
      const isMainArgument =
        !previousArgumentType ||
        previousArgumentType === argumentTypes.MAIN_ARGS_SEPARATOR;

      if (isMainArgument) _arguments.push(currentArgument);
      else if (Array.isArray(options[currentOption]))
        options[currentOption].push(currentArgument);
      else options[currentOption] = [currentArgument];
    }
  }

  return { options, arguments: _arguments };
};
