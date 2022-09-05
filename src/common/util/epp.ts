interface ArgumentObject {
  code: string;
  message: string;
  otherInfo?: object;
}

/**
 * EPP is a subclass of the Error class. It's main purpose is to augment the
 * Error class so that other properties (such as "code") can be
 * added to an error instance conveniently.
 *
 * Example:
 * ```js
 * const err = new EPP("name is invalid", "INVALID_NAME")
 * // or
 * const err = new EPP({
 *   code: "INVALID_NAME",
 *   message: "name is invalid",
 * });
 * err; // Error: {message: "name is invalid", code: "INVALID_NAME"}
 * ```
 * */
export default class EPP extends Error {
  public code: string;

  constructor(arg: ArgumentObject);
  constructor(message: string, code: string, otherInfo?: object);
  constructor(
    _message: string | ArgumentObject,
    _code?: string,
    _otherInfo: object = {}
  ) {
    let message, code, otherInfo;

    if (typeof _message === "object")
      ({ message, code, otherInfo = {} } = _message);
    else {
      message = _message;
      code = _code;
      otherInfo = _otherInfo;
    }

    super(message);

    this.code = String(code);

    {
      const { message, code, ...rest } = otherInfo as any;
      Object.assign(this, rest);
    }
  }
}
