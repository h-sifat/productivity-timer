import Database from "better-sqlite3";
import Project from "entities/project";
import { initializeDatabase } from "data-access/init-db";
import buildProjectDatabase from "data-access/project-db";
import type { Database as SqliteDatabase } from "better-sqlite3";
import ProjectDatabaseInterface from "use-cases/interfaces/project-db";

const IN_MEMORY_DB_PATH = ":memory:";

let projectDb: ProjectDatabaseInterface;
let _internalDb_: SqliteDatabase;

// -----    Test setup -----------------

beforeEach(async () => {
  _internalDb_ = new Database(IN_MEMORY_DB_PATH);
  await initializeDatabase(_internalDb_);

  projectDb = buildProjectDatabase({
    db: _internalDb_,
    notifyDatabaseCorruption: () => {},
  });
});

afterEach(() => {
  _internalDb_.close();
});

// -----    Test setup -----------------
describe("getMaxId", () => {
  it(`returns 0 if db is empty`, async () => {
    // currently our db is empty
    const maxId = await projectDb.getMaxId();
    expect(maxId).toBe(0);
  });

  it(`returns the maxId (i.e., lastInsertRowId)`, async () => {
    const id = 123;
    const project = (() => {
      return { ...Project.make({ name: "a" }), id: id.toString() };
    })();

    await projectDb.insert(project);

    const maxId = await projectDb.getMaxId();
    expect(maxId).toBe(id);
  });
});

describe("findById", () => {
  it(`returns null if no project is found with the given id`, async () => {
    // currently our db is empty
    expect(await projectDb.findById({ id: "123" })).toBeNull();
  });
});

describe("insert", () => {
  it(`inserts a new project`, async () => {
    const project = Project.make({ name: "study" });

    await projectDb.insert(project);

    const result = await projectDb.findById({ id: project.id });
    expect(result).toEqual(project);
  });

  it(`doesn't insert a project twice`, async () => {
    expect.assertions(1);

    const project = Project.make({ name: "study" });

    await projectDb.insert(project);

    try {
      await projectDb.insert(project);
    } catch (ex) {
      expect(ex.code).toBe("SQLITE_CONSTRAINT_PRIMARYKEY");
    }
  });

  it(`two projects cannot have same (case insensitive) name`, async () => {
    expect.assertions(1);

    const project = Project.make({ name: "study" });
    await projectDb.insert(project);

    try {
      const newProjectWithModifiedName = {
        ...project,
        id: project.id + "2",
        name: project.name.toUpperCase(),
      };
      await projectDb.insert(newProjectWithModifiedName);
    } catch (ex) {
      expect(ex.code).toBe("SQLITE_CONSTRAINT_UNIQUE");
    }
  });
});

describe("findAll", () => {
  it(`returns an empty array if no project exists`, async () => {
    const projects = await projectDb.findAll();
    expect(projects).toEqual([]);
  });

  it(`returns all the inserted categories`, async () => {
    const projects = Project.make({ name: "study" });
    await projectDb.insert(projects);

    const allCategories = await projectDb.findAll();
    expect(allCategories).toEqual([projects]);
  });
});

describe("findById", () => {
  it(`returns null if no project is found with the given name`, async () => {
    // currently our db is empty
    expect(await projectDb.findByName({ name: "todo" })).toBeNull();
  });

  it(`returns the project with the specified name (case insensitive)`, async () => {
    const project = Project.make({ name: "study" });
    await projectDb.insert(project);

    {
      const result = await projectDb.findByName({ name: project.name });
      expect(result).toEqual(project);
    }

    {
      const result = await projectDb.findByName({
        name: project.name.toUpperCase(),
      });
      expect(result).toEqual(project);
    }
  });
});

describe("deleteById", () => {
  it(`doesn't throw error if the document doesn't exist`, async () => {
    expect.assertions(0);

    try {
      await projectDb.deleteById({ id: "100" });
    } catch (ex) {
      expect(1).toBe(1);
    }
  });

  it(`deletes the project with the given id`, async () => {
    const project = Project.make({ name: "study" });
    await projectDb.insert(project);

    {
      const result = await projectDb.findById({ id: project.id });
      expect(result).toEqual(project);
    }

    await projectDb.deleteById({ id: project.id });

    {
      const result = await projectDb.findById({ id: project.id });
      expect(result).toBeNull();
    }
  });
});

describe("updateById", () => {
  it(`updates every columns except the id`, async () => {
    const todo = Project.make({ name: "todo" });
    const pomodoro = Project.make({ name: "pomodoro" });

    await projectDb.insert(todo);

    const beforeUpdate = await projectDb.findById({ id: todo.id });
    expect(beforeUpdate).toEqual(todo);

    await projectDb.updateById({ id: todo.id, edited: pomodoro });

    const afterUpdate = await projectDb.findById({ id: todo.id });
    expect(afterUpdate).toEqual({ ...pomodoro, id: todo.id });
  });
});
