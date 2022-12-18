import { deepFreeze } from "common/util/other";
import { makeFindByName } from "use-cases/project/find-by-name";

const database = Object.freeze({
  findByName: jest.fn(),
});

const findByName = makeFindByName({ database });

beforeEach(() => {
  Object.values(database).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_NAME";
    it(`it throws ewc "${errorCode}" if name is not a non_empty_string`, async () => {
      expect.assertions(2);
      try {
        await findByName({ name: "   " });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(database.findByName).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`returns the response from database.findByName method`, async () => {
    const fakeResponse = deepFreeze([{ name: "a" }]);
    database.findByName.mockResolvedValueOnce(fakeResponse);

    const name = "  study  ";
    const result = await findByName({ name });

    expect(result).toEqual(fakeResponse);
    expect(database.findByName).toHaveBeenCalledTimes(1);
    expect(database.findByName).toHaveBeenCalledWith({ name: name.trim() });
  });
});
