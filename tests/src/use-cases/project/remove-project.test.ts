import EPP from "common/util/epp";
import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeRemoveProject from "use-cases/project/remove-project";

const deleteById = jest.fn();
const db = Object.freeze({ deleteById });

const removeProject = makeRemoveProject({ db, isValidId });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockClear());
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
  it(`return delete and the project record`, async () => {
    const projectRecord = new Project({ name: "todo" }).toPlainObject();
    const id = projectRecord.id;

    deleteById.mockResolvedValueOnce(projectRecord);

    const deleted = await removeProject({ id });

    expect(deleteById).toHaveBeenLastCalledWith({ id });

    expect(deleted).toEqual(projectRecord);
  });

  {
    const errorCode = "NOT_FOUND";
    it(`throws ewc "${errorCode}" if project doesn't exist with the given id`, async () => {
      expect.assertions(3);

      const id = "100";
      deleteById.mockRejectedValueOnce(
        new EPP(`No project exist with id: "${id}"`, errorCode)
      );

      try {
        await removeProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.message).toEqual(expect.any(String));
      }

      expect(deleteById).toHaveBeenLastCalledWith({ id });
    });
  }
});
