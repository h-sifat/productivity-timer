module.exports = class EPP extends Error {
  constructor(...args) {
    let message, code, otherInfo;

    // if the first arg is an object, then it should be {message: string, code?: string, ...otherInfo}
    if (args.length === 1 && typeof args[0] === "object")
      ({ message, code, ...otherInfo } = args[0]);
    // otherwise we've new EPP(message[, code?, otherInfo?]);
    else [message, code, otherInfo] = args;

    super(message);

    if (code) this.code = code.toString();

    {
      const isOtherInfoANonEmptyObject =
        typeof otherInfo === "object" &&
        otherInfo !== null &&
        Object.keys(otherInfo).length > 0;

      if (isOtherInfoANonEmptyObject) this.otherInfo = otherInfo;
    }
  }
};
