import colors from "ansi-colors";
import type { Log, LogType } from "./interface";

export const TAB_CHAR = " ".repeat(4);

const messageTypeAndSymbolMap = {
  normal: "",
  fatal_error: "",
  info: colors.gray(colors.symbols.info) + " ",
  error: colors.redBright(colors.symbols.cross) + " ",
  success: colors.greenBright(colors.symbols.check) + " ",
} as const;

/**
 * If the app is running as a sub-process then this function sends the
 * log to the parent process. Otherwise it just prints it to the console.
 * */
function _log(arg: Parameters<Log>[0], _indentLevel = 0) {
  let indentLevel: number,
    _message: string,
    type: LogType = "normal";

  if (typeof arg === "object") {
    ({ indentLevel = 0, type = "normal", message: _message } = arg);
  } else {
    _message = arg;
    indentLevel = _indentLevel;
  }

  const message =
    type === "fatal_error" ? colors.redBright(_message) : _message;

  const formattedMessage =
    TAB_CHAR.repeat(indentLevel) + messageTypeAndSymbolMap[type] + message;

  if (process.send) {
    process.send({ type: "log", message: formattedMessage });
  } else {
    console.log(formattedMessage);
  }
}

const log: Log = Object.assign(_log, {
  info(message: string, indentLevel = 0) {
    _log({ message, type: "info", indentLevel });
  },
  error(message: string, indentLevel = 0) {
    _log({ message, type: "error", indentLevel });
  },
  success(message: string, indentLevel = 0) {
    _log({ message, type: "success", indentLevel });
  },
});

Object.freeze(log);

export { log };
