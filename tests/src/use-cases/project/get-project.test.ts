import { isValid as isValidId } from "common/util/id";
import Project from "entities/project";
import makeGetProject from "use-cases/project/get-project";

const findById = jest.fn();
const db = Object.freeze({ findById });

const getProject = makeGetProject({ db, isValidId });

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
        await getProject({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if no project is found with the given id`, async () => {
      expect.assertions(3);

      const id = "100";
      findById.mockResolvedValueOnce(null);

      try {
        await getProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.message).toEqual(expect.any(String));
      }

      expect(findById).toHaveBeenLastCalledWith({ id });
    });
  }

  {
    const errorCode = "CORRUPTED";
    it(`throws ewc "${errorCode}" if the project returned by is corrupted`, async () => {
      expect.assertions(3);

      const id = "100";
      findById.mockResolvedValueOnce({});

      try {
        await getProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.message).toEqual(expect.any(String));
      }

      expect(findById).toHaveBeenLastCalledWith({ id });
    });
  }

  it(`returns the project if it exists an not corrupted`, async () => {
    const insertedProjectInfo = new Project({ name: "Todo" }).toPlainObject();

    findById.mockResolvedValueOnce(insertedProjectInfo);

    const queriedProjectInfo = await getProject({ id: insertedProjectInfo.id });

    expect(queriedProjectInfo).toEqual(insertedProjectInfo);
  });
});
