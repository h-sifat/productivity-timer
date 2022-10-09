import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeRemoveProject from "use-cases/project/remove-project";

const db = Object.freeze({
  findById: jest.fn(),
  deleteById: jest.fn(),
});

const removeProject = makeRemoveProject({ db, isValidId });

beforeEach(() => {
  db.findById.mockReset();
  db.deleteById.mockReset();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await removeProject({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it(`returns the deleted project record`, async () => {
    expect.assertions(5);

    const project = Project.make({ name: "todo" });
    const id = project.id;

    db.findById.mockResolvedValueOnce(project);

    const deleted = await removeProject({ id });
    expect(deleted).toEqual(project);

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.deleteById).toHaveBeenCalledTimes(1);

    expect(db.findById).toHaveBeenCalledWith({ id });
    expect(db.deleteById).toHaveBeenCalledWith({ id });
  });

  {
    const errorCode = "NOT_FOUND";
    it(`throws ewc "${errorCode}" if project doesn't exist with the given id`, async () => {
      expect.assertions(4);

      db.findById.mockResolvedValueOnce(null);

      const id = "100";

      try {
        await removeProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.deleteById).not.toHaveBeenCalled();

      expect(db.findById).toHaveBeenCalledWith({ id });
    });
  }
});
