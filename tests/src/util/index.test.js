const { assertPlainObject } = require("../../../src/util");

describe("assertPlainObject", () => {
  const ERROR_CODE = "NOT_PLAIN_OBJECT";

  it.each([null, [1, 2], 4, "hello", Symbol(), undefined])(
    `throws "${ERROR_CODE}" for value: %o`,
    (object) => {
      expect.assertions(1);
      try {
        assertPlainObject({ object, errorCode: ERROR_CODE, name: "user" });
      } catch (ex) {
        expect(ex.code).toBe(ERROR_CODE);
      }
    }
  );

  it("doesn't throw error for a plain object", () => {
    expect.assertions(0);
    try {
      assertPlainObject({
        object: { a: 1 },
        errorCode: ERROR_CODE,
        name: "user",
      });
    } catch (ex) {
      expect(ex.code).toBe(ERROR_CODE);
    }
  });
});
