const EPP = require("../../../src/util/epp");

describe("EPP", () => {
  const message = "oops!";
  const code = "code";
  const otherInfo = { a: 1 };

  describe("EPP from object argument", () => {
    it("creates error object form the argument object", () => {
      const error = new EPP({ message, code, ...otherInfo });

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.otherInfo).toEqual(otherInfo);
    });

    it("omits the code and otherInfo property if missing in the argument object", () => {
      const error = new EPP({ message });
      expect(error.message).toBe(message);

      expect(error).not.toHaveProperty("code");
      expect(error).not.toHaveProperty("otherInfo");
    });
  });

  describe("EPP from rest argument", () => {
    it("creates error object form the given arguments", () => {
      const error = new EPP(message, code, otherInfo);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.otherInfo).toEqual(otherInfo);
    });
  });

  describe("Validation", () => {
    it("converts the code to string if it is not", () => {
      const badErrorCode = { code: "hey!" };

      const error = new EPP(message, badErrorCode);

      expect(error.code).toBe(badErrorCode.toString());
    });

    it("does not set the otherInfo property if it's not a non empty object", () => {
      const error = new EPP(message, code, "not_an_object");
      expect(error).not.toHaveProperty("otherInfo");
    });
  });
});
