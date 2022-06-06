class EPP extends Error {
  constructor(message, code, otherInfo = {}) {
    super(message);
    this.code = code;
    Object.assign(this, otherInfo);
  }
}

function required(name) {
  throw new EPP(`Property "${name}" is missing.`, "MISSING_PROPERTY");
}

module.exports = {
  EPP,
  required,
};
