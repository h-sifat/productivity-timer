module.exports = class EPP extends Error {
  constructor(message, code, otherInfo = {}) {
    super(message);
    this.code = code;
    Object.assign(this, otherInfo);
  }
};
