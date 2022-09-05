import { isValid } from "common/util/id";
import { ID } from "common/interfaces/id";
import categoryFixture from "fixtures/category";
import buildCategoryClass from "entities/category/category";
import makeTimestampsValidator from "common/util/timestamp-validator";
import { isValidUnixMsTimestamp } from "common/util/date-time";

let makeId: ID["makeId"];

{
  const category = categoryFixture();

  // I'm combining the fixture's id and parentId to eliminate
  // the chance of accidentally returning an id that is equal to fixture's
  // parentId.
  // In that case the Category class will throw an error with code
  // "SELF_ID_EQUAL_PARENT_ID"
  makeId = jest.fn().mockReturnValue(category.id + category.parentId);
}

const Id: ID = Object.freeze({ isValid, makeId });

const { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } = (() => {
  const category = categoryFixture();

  const MAX_DESCRIPTION_LENGTH = category.description
    ? category.description.length + 1
    : 5;

  return {
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH: category.name.length + 1,
  };
})();

const creationAndModificationTimestampsValidator = makeTimestampsValidator({
  getNewTimestamp: () => 200,
  isValidTimestamp: isValidUnixMsTimestamp,
});

const Category = buildCategoryClass({
  Id,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  creationAndModificationTimestampsValidator,
});

describe("Constructor Validation", () => {
  describe("field:name", () => {
    it.each([
      {
        name: 2334,
        code: "INVALID_NAME",
        case: "is not a non_empty_string",
      },
      {
        name: "",
        code: "INVALID_NAME",
        case: "is not a non_empty_string",
      },
      {
        name: "a".repeat(MAX_NAME_LENGTH + 1),
        code: "NAME_TOO_LONG",
        case: "is longer than MAX_NAME_LENGTH",
      },
    ])(
      `throws error with code "$code" if name ($name) $case`,
      ({ name, code }) => {
        expect(() => {
          // @ts-ignore
          new Category(categoryFixture({ name }));
        }).toThrowErrorWithCode(code);
      }
    );

    it('throws error with code "MISSING_PROPERTY" if "name" is missing', () => {
      const argWithNoName = categoryFixture();

      // @ts-expect-error
      delete argWithNoName.name;

      expect(() => {
        new Category(argWithNoName);
      }).toThrowErrorWithCode("MISSING_NAME_FIELD");
    });
  });

  describe("Other", () => {
    it.each(["id", "parentId"])(
      `does not throw error if the %p is missing in constructor argument`,
      (property) => {
        const invalidArg = categoryFixture();

        // @ts-expect-error
        delete invalidArg[property];

        expect(() => {
          new Category(invalidArg);
        }).not.toThrow();
      }
    );
  });

  describe("fields:id and parentId", () => {
    it.each([
      { property: "id", errorCode: "INVALID_ID" },
      { property: "parentId", errorCode: "INVALID_PARENT_ID" },
    ])(
      `throws error with code "$errorCode" if "$property" is invalid`,
      ({ property, errorCode }) => {
        const invalidId = "non_numeric_string";

        expect(Id.isValid(invalidId)).toBeFalsy();

        const argWithInvalidId = categoryFixture({ [property]: invalidId });
        expect(() => {
          new Category(argWithInvalidId);
        }).toThrowErrorWithCode(errorCode);
      }
    );

    it('throws error with code "SELF_ID_EQUAL_PARENT_ID" if id and parentId are equal', () => {
      const validId = "12312";

      expect(Id.isValid(validId)).toBeTruthy();

      const argWithSameId = categoryFixture({ id: validId, parentId: validId });

      expect(() => {
        new Category(argWithSameId);
      }).toThrowErrorWithCode("SELF_ID_EQUAL_PARENT_ID");
    });

    it("does not throw error if parentId is null", () => {
      const arg = categoryFixture({ parentId: null });

      expect(() => {
        new Category(arg);
      }).not.toThrow();
    });
  });

  describe("field:description", () => {
    it.each([
      {
        description: 2334,
        code: "INVALID_DESCRIPTION",
        case: "is not a non_empty_string",
      },
      {
        description: "",
        code: "INVALID_DESCRIPTION",
        case: "is not a non_empty_string",
      },
      {
        description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1),
        code: "DESCRIPTION_TOO_LONG",
        case: "is longer than MAX_DESCRIPTION_LENGTH",
      },
    ])(
      `throws error with code "$code" if description ($description) $case`,
      ({ description, code }) => {
        expect(() => {
          // @ts-ignore
          new Category(categoryFixture({ description }));
        }).toThrowErrorWithCode(code);
      }
    );

    it("does not throw error if description is null", () => {
      const arg = categoryFixture({ description: null });

      expect(() => {
        new Category(arg);
      }).not.toThrow();
    });
  });

  describe("mainArgObject", () => {
    it('throws error with code "INVALID_MAIN_ARG" if constructor argument is not a plain_object', () => {
      expect(() => {
        // @ts-expect-error
        new Category(["non_a_plain_object"]);
      }).toThrowErrorWithCode("INVALID_MAIN_ARG");
    });
  });
});

describe("Other", () => {
  describe("Getters", () => {
    test(`every field has a getter`, () => {
      const arg = categoryFixture();
      const category = new Category(arg);

      expect(category.id).toBe(arg.id);
      expect(category.name).toBe(arg.name);
      expect(category.createdOn).toBe(arg.createdOn);
      expect(category.modifiedOn).toBe(arg.modifiedOn);
      expect(category.parentId).toBe(arg.parentId);
      expect(category.description).toBe(arg.description);
    });
  });

  describe("toPlainObject", () => {
    it("returns a frozen category object", () => {
      const arg = categoryFixture();
      const category = new Category(arg).toPlainObject();

      expect(Object.isFrozen(category)).toBeTruthy();
      expect(category).toEqual(arg);
    });
  });

  describe("Defaults", () => {
    test.each(["description", "parentId"] as const)(
      "if %p is not provided then it's value should be null",
      (property) => {
        const arg = categoryFixture();
        // @ts-expect-error
        delete arg[[property]];

        const category = new Category(arg);
        expect(category[property]).toBeNull();
      }
    );
  });
});
