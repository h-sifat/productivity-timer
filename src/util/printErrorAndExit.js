/**
 * This function prints the given error message and exits the current process
 * whit the given exit code or 1 if not provided.
 *
 * @param: {string | {message: string; exitCode?: number}}
 * */
function printErrorAndExit(arg) {
  let message,
    exitCode = 1;

  if (typeof arg === "string") message = arg;
  else if (typeof arg === "object" && arg !== null) {
    message = arg.message;
    if (arg.exitCode) exitCode = arg.exitCode;
  } else message = `Internal Error: Invalid argument to printErrorAndExit().`;

  console.error(message);
  process.exit(exitCode);
}

module.exports = printErrorAndExit;
