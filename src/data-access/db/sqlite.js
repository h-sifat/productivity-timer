const Sqlite3 = require("better-sqlite3");

module.exports = class __SqliteDb__ {
  #db = null;
  #preparedStatements = {};

  open(arg) {
    if (this.#db)
      throw new EPP({
        message: `The database is already open.`,
        code: "DB_IS_ALREADY_OPEN",
      });

    const { path } = arg;
    this.#db = new Sqlite3(path, { fileMustExist: true });
  }

  close() {
    this.#assertDbIsOpen();

    this.#db.close();
    this.#db = null;
    this.#preparedStatements = {};
  }

  pragma(arg) {
    this.#assertDbIsOpen();

    const { command: pragmaCommand } = arg;
    return this.#db.pragma(pragmaCommand, { simple: true });
  }

  isPrepared(arg) {
    this.#assertDbIsOpen();

    const { name } = arg;
    return name in this.#preparedStatements;
  }

  deletePrepared(arg) {
    this.#assertDbIsOpen();

    const { name } = arg;
    delete this.#preparedStatements[name];

    if (name in this.#preparedStatements)
      throw new EPP({
        code: "IE:COULD_NOT_DELETE_STMT",
        message: `Internal Error: Couldn't delete prepared statement: "${name}"`,
      });
  }

  prepare(arg) {
    this.#assertDbIsOpen();

    const { name, statement, overrideIfExists } = arg;

    if (!overrideIfExists && name in this.#preparedStatements) return;

    this.#preparedStatements[name] = this.#db.prepare(statement);
  }

  #executePreparedStatement(arg) {
    const { name } = arg;

    if (!(name in this.#preparedStatements))
      throw new EPP({
        code: "STMT_DOES_NOT_EXIST",
        message: `No prepared statement found with name: "${name}"`,
      });

    {
      const { method } = arg;

      const { statementArgs = {} } = arg;
      return this.#preparedStatements[name][method](statementArgs);
    }
  }

  runPrepared(arg) {
    this.#assertDbIsOpen();
    return this.#executePreparedStatement({ method: "run", ...arg });
  }

  executePrepared(arg) {
    this.#assertDbIsOpen();
    return this.#executePreparedStatement({ method: "all", ...arg });
  }

  execute(arg) {
    this.#assertDbIsOpen();
    this.#db.exec(arg.sql);
  }

  backup(arg) {
    this.#assertDbIsOpen();
    return this.#db.backup(arg.destination);
  }

  isOpen() {
    return !!this.#db;
  }

  #assertDbIsOpen() {
    if (!this.#db)
      throw new EPP({
        code: "DB_NOT_INITIALIZED",
        message:
          "Database has not been initialized yet. Please open a database first.",
      });
  }
};

class EPP extends Error {
  constructor({ message, code }) {
    super(message);
    this.code = code;
  }
}
