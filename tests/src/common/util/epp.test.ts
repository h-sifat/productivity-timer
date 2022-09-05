import EPP from "common/util/epp";

const MESSAGE = "oops!";
const CODE = "ERR_CODE";

describe("EPP(Error Plus Plus)", () => {
  describe("Construction with Object Arg", () => {
    it("creates an error object with the given message and code", () => {
      const error = new EPP({ code: CODE, message: MESSAGE });

      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ message: MESSAGE, code: CODE });
    });

    it("assigns all the props from otherInfo object if provided", () => {
      const otherInfo = Object.freeze({
        ref: 2,
        path: "/dev/null",
      });

      const error = new EPP({ code: CODE, message: MESSAGE, otherInfo });

      expect(error).toMatchObject(otherInfo);
    });
  });

  describe("Construction with normal arguments", () => {
    it("creates an error object with the given message and code", () => {
      const error = new EPP(MESSAGE, CODE);

      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ message: MESSAGE, code: CODE });
    });

    it("assigns all the props from otherInfo object if provided", () => {
      const otherInfo = Object.freeze({
        ref: 2,
        path: "/dev/null",
      });

      const error = new EPP(MESSAGE, CODE, otherInfo);
      expect(error).toMatchObject(otherInfo);
    });
  });

  describe("Other", () => {
    it("should ", () => {
      const otherInfo = Object.freeze({
        message: MESSAGE + "x",
        code: CODE + "x",
      });

      const errors = [
        new EPP(MESSAGE, CODE, otherInfo),
        new EPP({ code: CODE, message: MESSAGE, otherInfo }),
      ];

      for (const error of errors) {
        expect(error).toMatchObject({ message: MESSAGE, code: CODE });

        expect(error.message).not.toBe(otherInfo.message);
        expect(error.code).not.toBe(otherInfo.code);
      }
    });
  });
});
