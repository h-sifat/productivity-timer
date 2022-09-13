import Project from "entities/project";
import ProjectDatabase from "./project-db";

const db = new ProjectDatabase();

beforeEach(async () => {
  await db.clearDb();
});

describe("The name is unique and case insensitive", () => {
  {
    const errorCode = "DUPLICATE_NAME";

    it(`throws ewc "${errorCode}" if the "name" field is not unique in an inserting doc`, async () => {
      expect.assertions(3);

      const name = "todo";
      const projectA = new Project({ name }).toPlainObject();
      const projectB = new Project({
        name: "  \n" + name.toUpperCase() + "  \n",
      }).toPlainObject();

      expect(projectA).not.toEqual(projectB);

      await db.insert(projectA);

      try {
        await db.insert(projectB);
      } catch (ex) {
        expect(ex.code).toBe("DUPLICATE_NAME");
      }

      await db.deleteById({ id: projectA.id });

      // as projectA is delete now we should be able to insert projectB with
      // name `"todo".toUpperCase()`
      const inserted = await db.insert(projectB);
      expect(inserted).toEqual(projectB);
    });
  }
});

describe("clearDb", () => {
  it(`clears the nameIndex`, async () => {
    expect.assertions(3);

    const name = "todo";
    const projectA = new Project({ name }).toPlainObject();
    const projectB = new Project({
      name: "  \n" + name.toUpperCase() + "  \n",
    }).toPlainObject();

    expect(projectA).not.toEqual(projectB);

    await db.insert(projectA);

    try {
      await db.insert(projectB);
    } catch (ex) {
      expect(ex.code).toBe("DUPLICATE_NAME");
    }

    await db.clearDb();

    // as projectA is delete now we should be able to insert projectB with
    // name `"todo".toUpperCase()`
    const inserted = await db.insert(projectB);
    expect(inserted).toEqual(projectB);
  });
});

describe("findAll", () => {
  it(`returns all the documents`, async () => {
    const project = new Project({ name: "Timer App" }).toPlainObject();
    await db.insert(project);

    const allInsertedDocuments = await db.findAll();

    expect(allInsertedDocuments).toEqual([project]);
  });
});

describe("findByName", () => {
  {
    const errorCode = "MISSING_NAME";
    it(`throws ewc "${errorCode}" if the name property is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await db.findByName({});
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "INVALID_NAME";
    it(`throws ewc "${errorCode}" if name is not a non_empty_string`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await db.findByName({ name: ["non a non_empty_string"] });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`returns null if no project is found by the given name`, async () => {
    // no project exists in the db right now
    expect(await db.findByName({ name: "abraka.." })).toBeNull();
  });

  it(`finds a document by name`, async () => {
    const project = new Project({ name: "Timer App" }).toPlainObject();
    await db.insert(project);

    // search should be case insensitive
    const found = await db.findByName({ name: project.name.toUpperCase() });

    expect(found).toEqual(project);
  });
});
