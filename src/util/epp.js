module.exports = class EPP extends Error {
  constructor(...args) {
    const { message, code, otherInfo } = (() => {
      // if the first arg is an object, then it should be {message: string, code?: string}
      if (args.length === 1 && typeof args[0] === "object") {
        const { message, code, ...otherInfo } = args[0];
        return { message, code, otherInfo };
      } else {
        // otherwise we've new EPP(message, code, otherInfo);
        const [message, code, otherInfo = {}] = args;
        return { message, code, otherInfo };
      }
    })();

    super(message);
    if (code) this.code = code;
    Object.assign(this, otherInfo);
  }
};
