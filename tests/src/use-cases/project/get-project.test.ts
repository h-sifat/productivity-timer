import { isValid as isValidId } from "common/util/id";
import makeGetProject from "use-cases/project/get-project";

const db = Object.freeze({
  findById: jest.fn(),
});
const getProject = makeGetProject({ db, isValidId });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(3);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await getProject({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`returns whatever the db.findById returns without validation`, async () => {
    const id = "123";
    const project = "todo";

    db.findById.mockResolvedValueOnce(project);

    expect(await getProject({ id })).toEqual(project);

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findById).toHaveBeenCalledWith({ id });
  });
});
