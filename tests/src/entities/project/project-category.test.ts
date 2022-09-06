import { isValid as isValidId } from "common/util/id";
import makeProjectCategoryClass from "entities/project/project-category";
import projectCategoryFixture from "fixtures/project-category";

const ProjectCategory = makeProjectCategoryClass({
  isValidId,
});

describe("Constructor", () => {
  describe("MainArgument", () => {
    it("throws error if main argument to the constructor is not a plain object", () => {
      expect(() => {
        // @ts-expect-error
        new ProjectCategory(null);
      }).toThrowErrorWithCode("INVALID_MAIN_ARG");
    });
  });

  describe("field:id", () => {
    it("throws error if id is missing from the constructor argument", () => {
      expect(() => {
        // @ts-expect-error
        new ProjectCategory({});
      }).toThrowErrorWithCode("MISSING_ID");
    });

    it("throws error if id is not valid", () => {
      const invalidId = ["not_a_string"];
      expect(isValidId(invalidId)).toBeFalsy();

      expect(() => {
        // @ts-expect-error
        new ProjectCategory({ id: invalidId });
      }).toThrowErrorWithCode("INVALID_ID");
    });

    it(`doesn't throw error with code code "INVALID_ID" if id is valid`, () => {
      const arg = projectCategoryFixture();

      expect(isValidId(arg.id)).toBeTruthy();

      expect(() => {
        new ProjectCategory(arg);
      }).not.toThrow();
    });
  });

  describe("field:fullName", () => {
    it('throws error with code "MISSING_FULLNAME" if fullName is provided', () => {
      const arg = projectCategoryFixture();

      // @ts-expect-error
      delete arg.fullName;

      expect(() => {
        new ProjectCategory(arg);
      }).toThrowErrorWithCode("MISSING_FULLNAME");
    });

    it('throws error with code "INVALID_FULLNAME" if fullName is not a non_empty_string', () => {
      const arg = projectCategoryFixture();

      // @ts-expect-error
      arg.fullName = "";

      expect(() => {
        new ProjectCategory(arg);
      }).toThrowErrorWithCode("INVALID_FULLNAME");
    });
  });

  describe("toPlainObject", () => {
    it("returns a frozen projectCategory object", () => {
      const arg = projectCategoryFixture();

      const pcObject = new ProjectCategory(arg).toPlainObject();

      expect(Object.isFrozen(pcObject)).toBeTruthy();
      expect(pcObject).toEqual(arg);
    });
  });

  describe("Other", () => {
    it(`doesn't throw any error if everything is valid`, () => {
      const arg = projectCategoryFixture();

      expect(() => {
        // @ts-ignore
        const projectCategory = new ProjectCategory(arg);
        expect(projectCategory.id).toBe(arg.id);
        expect(projectCategory.fullName).toBe(arg.fullName);
      }).not.toThrow();
    });

    it("is serializable", () => {
      const arg = projectCategoryFixture();
      const projectCategory = new ProjectCategory(arg);

      expect(JSON.stringify(projectCategory)).toBe(JSON.stringify(arg));
    });
  });
});
