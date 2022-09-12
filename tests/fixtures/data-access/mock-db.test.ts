import MockDb from "./mock-db";
import EPP from "common/util/epp";
import type { QueryExecutorMethodArg } from "./mock-db";

const db: MockDb<string | number, any> = new MockDb();

beforeEach(async () => {
  await db.clearDb();
});

describe("insert", () => {
  it(`inserts a document`, async () => {
    const doc = { id: 1, a: 1 };

    const inserted = await db.insert(doc);

    expect(Object.isFrozen(inserted)).toBeTruthy();
    expect(inserted).toEqual(doc);

    const queried = await db.findById({ id: doc.id });

    expect(queried).toEqual(inserted);
  });

  it(`doesn't insert a document twice with the same id`, async () => {
    const id = 1;
    const docA = { id, a: 1 };
    const docB = { id, b: 2 };

    expect(docA).not.toEqual(docB);

    await db.insert(docA);
    await db.insert(docB);

    const inserted = await db.findById({ id });

    expect(inserted).toEqual(docA);
  });
});

describe("findById", () => {
  it(`returns null if no document exists with the given id`, async () => {
    // now our db is empty
    const doc = await db.findById({ id: 1 });
    expect(doc).toBeNull();
  });
});

describe("updateById", () => {
  it(`updates a document but not the id field`, async () => {
    const id = 1;
    const oldName = "old";
    const newName = "new";

    const oldDoc = { id, name: oldName };
    const newDoc = { id: id + 1, name: newName };

    await db.insert(oldDoc);

    const updated = await db.updateById({ id, changes: newDoc });

    expect(updated).toEqual({ id, name: newName });
    expect(updated.id).not.toBe(newDoc.id);
  });
});

describe("deleteById", () => {
  it(`deletes a document if exists`, async () => {
    const inserted = await db.insert({ id: 1, a: 1 });
    const deleted = await db.deleteById({ id: inserted.id });

    expect(deleted).toEqual(inserted);

    {
      const result = await db.findById({ id: inserted.id });
      expect(result).toBeNull();
    }
  });
});

describe("corruptById", () => {
  it(`sets an arbitrary value as document for the given id`, async () => {
    const id = 1;
    const document = { a: 1 };

    await db.corruptById({ id, unValidatedDocument: document });

    const result = await db.findById({ id });

    expect(result).toEqual(document);
  });
});

describe("insertMany", () => {
  it(`inserts multiple document`, async () => {
    const documents = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      a: "s_" + i,
    }));

    const insertedDocuments = await db.insertMany(documents);

    expect(await db.count()).toBe(documents.length);

    expect(insertedDocuments).toEqual(documents);
  });
});

describe("find", () => {
  it(`returns all the documents in the db`, async () => {
    expect(await db.find()).toHaveLength(0);

    const documents = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      a: "s_" + i,
    }));

    await db.insertMany(documents);

    const insertedDocuments = await db.find();

    expect(insertedDocuments).toEqual(documents);
  });
});

describe("onNextQuery", () => {
  it(`if the "onNextQuery" property is set then it will be called before executing a query`, async () => {
    expect(db.onNextQuery).toBeNull();

    const onNextQuery = jest.fn();
    db.onNextQuery = onNextQuery;

    expect(db.onNextQuery).toBe(onNextQuery);

    const document = { id: 1, a: 1 };
    await db.insert(document);

    // the onNextQuery function gets removed after one query
    expect(db.onNextQuery).toBeNull();

    expect(onNextQuery).toHaveBeenCalledTimes(1);
    expect(onNextQuery).toHaveBeenCalledWith({
      arg: document,
      method: "insert",
      resolve: expect.any(Function),
      reject: expect.any(Function),
      skipSignal: expect.any(Symbol),
    });
  });

  it(`can stop the query execution and resolve or reject any value`, async () => {
    expect.assertions(2);

    const document = { id: 1, a: 1 };
    const inserted = await db.insert(document);
    expect(inserted).toEqual(document);

    const unexpectedError = new EPP({
      code: "COMPUTER_IS_BORED",
      message: "I'm tired of executing your crappy code!",
    });

    db.onNextQuery = ({ reject, skipSignal }) => {
      reject(unexpectedError);
      return skipSignal;
    };

    try {
      await db.findById({ id: document.id });
    } catch (ex) {
      expect(ex).toEqual(unexpectedError);
    }
  });
});

describe("...byId", () => {
  const errorCode = "NOT_FOUND";

  it.each([
    { method: "updateById", id: 1 },
    { method: "deleteById", id: 1 },
  ] as const)(
    `"$method": throws ewc "${errorCode}" if no doc exists with the given id`,
    async ({ method, id }) => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await db[method]({ id });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    }
  );
});

describe("count", () => {
  it(`it returns the number of documents in db`, async () => {
    expect(await db.count()).toBe(0);

    const document = { id: 1 };
    await db.insert(document);

    expect(await db.count()).toBe(1);

    await db.deleteById({ id: document.id });

    expect(await db.count()).toBe(0);
  });
});

describe("clearDb", () => {
  it(`deletes all the documents stored in the db`, async () => {
    expect(await db.count()).toBe(0);

    await db.insert({ id: 1 });

    expect(await db.count()).toBe(1);

    await db.clearDb();

    expect(await db.count()).toBe(0);
  });
});

describe("Id Validation", () => {
  {
    const errorCode = "MISSING_ID";
    it.each(["insert", "updateById", "deleteById", "findById", "corruptById"])(
      `"%s": throws ewc "${errorCode}" if the no id is provided`,
      async (method) => {
        expect.assertions(1);

        try {
          // @ts-ignore
          await db[method]({});
        } catch (ex) {
          expect(ex.code).toBe(errorCode);
        }
      }
    );
  }

  {
    const errorCode = "INVALID_ID";
    it.each([
      { method: "insert", arg: { id: -1 } },
      { method: "updateById", arg: { id: "" } },
      { method: "deleteById", arg: { id: 0 } },
      { method: "findById", arg: { id: -2342 } },
      { method: "corruptById", arg: { id: -2342 } },
      { method: "insertMany", arg: [{ id: -2342 }] },
    ])(
      `"$method": throws ewc "${errorCode}" if the given id is invalid`,
      async ({ method, arg }) => {
        expect.assertions(1);

        try {
          // @ts-ignore
          await db[method](arg);
        } catch (ex) {
          expect(ex.code).toBe(errorCode);
        }
      }
    );
  }
});

describe("MockDb is extendable", () => {
  interface User {
    name: string;
  }

  class MyDb extends MockDb<string, User> {
    async findByName(arg: { name: string }): Promise<User> {
      return this.enqueueQuery({ arg, method: "findByName" });
    }

    protected __findByName__(query: QueryExecutorMethodArg) {
      const { arg, resolve } = query;

      const name = arg.name.toLowerCase();
      for (const user of this.store.values())
        if (user.name.toLowerCase() === name) return resolve(user);

      resolve(null);
    }
  }

  const customDb = new MyDb();

  beforeEach(async () => {
    await customDb.clearDb();
  });

  describe("CustomQueryMethod: findByName", () => {
    it(`returns null if no document is found with the given name`, async () => {
      const result = await customDb.findByName({ name: "Alex" });
      expect(result).toBeNull();
    });

    it(`returns the matching document`, async () => {
      const insertedDocument = { id: 1, name: "Alex" };
      await customDb.insert(insertedDocument);
      const result = await customDb.findByName({ name: "aLeX" });
      expect(result).toEqual(insertedDocument);
    });
  });
});
