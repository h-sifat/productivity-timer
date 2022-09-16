import { isValid } from "common/util/id";
import { ID } from "common/interfaces/id";
import { createMD5Hash } from "common/util/other";
import { assertValidString } from "common/validator/string";
import buildCategoryEntity from "entities/category/category";
import { assertValidUnixMsTimestamp } from "common/util/date-time";

const Id: ID = (() => {
  let id = 1;
  return Object.freeze({ isValid, makeId: () => (id++).toString() });
})();

const currentTimeMs = (() => {
  let time = Date.now();
  return () => ++time;
})();

const MAX_NAME_LENGTH = 5;
const MAX_DESCRIPTION_LENGTH = 20;
const VALID_NAME_PATTERN = /^[\w ]+$/;
const MSG_NAME_DOES_NOT_MATCH_PATTERN =
  "Category name must only consist of alphanumeric and whitespace characters";

const Category = buildCategoryEntity({
  Id,
  currentTimeMs,
  MAX_NAME_LENGTH,
  assertValidString,
  VALID_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH,
  createHash: createMD5Hash,
  assertValidUnixMsTimestamp,
  MSG_NAME_DOES_NOT_MATCH_PATTERN,
});

describe("Category.make", () => {
  describe("field:name", () => {
    it.each([
      {
        name: 2334,
        code: "INVALID_NAME",
        case: "is not a non_empty_string",
      },
      {
        name: "a/b",
        code: "INVALID_NAME",
        case: "contains invalid chars out of VALID_NAME_PATTERN",
      },
      {
        name: "",
        code: "NAME_TOO_SHORT",
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
          Category.make({ name });
        }).toThrowErrorWithCode(code);
      }
    );

    {
      const errorCode = "MISSING_NAME";
      it(`throws error with code "${errorCode}" if "name" is missing`, () => {
        expect(() => {
          // @ts-ignore
          Category.make({});
        }).toThrowErrorWithCode(errorCode);
      });
    }

    it.each([
      { property: "name", value: "    study " },
      { property: "description", value: "    Description " },
    ] as const)(
      `trims whitespace from the $property field`,
      ({ property, value }) => {
        const arg = { name: "a", [property]: value };
        const category = Category.make(arg);

        expect(category[property]).toBe(value.trim());
      }
    );
  });

  describe("Other", () => {
    const arg = { name: "todo", id: "1", parentId: "100" };
    it.each(["id", "parentId"] as const)(
      `does not throw error if the %p is missing in constructor argument`,
      (property) => {
        delete arg[property];

        expect(() => {
          Category.make(arg);
        }).not.toThrow();
      }
    );
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
        code: "DESCRIPTION_TOO_SHORT",
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
          Category.make({ name: "a", description });
        }).toThrowErrorWithCode(code);
      }
    );

    it("does not throw error if description is null", () => {
      expect(() => {
        // @ts-ignore
        Category.make({ name: "a", description: null });
      }).not.toThrow();
    });
  });

  describe("mainArgObject", () => {
    {
      const errorCode = "INVALID_MAKE_ARG";

      it(`throws error with code "${errorCode}" if constructor argument is not a plain_object`, () => {
        expect(() => {
          // @ts-expect-error
          Category.make(["non_a_plain_object"]);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("Other", () => {
    describe("Defaults", () => {
      test.each(["description", "parentId"] as const)(
        "if %p is not provided then it's value should be null",
        (property) => {
          const category = Category.make({ name: "a" });
          expect(category[property]).toBeNull();
        }
      );
    });

    describe("hashing", () => {
      it("creates the same hash for categories with same name but different casing", () => {
        const name = "Study";
        const categoryA = Category.make({ name });
        const categoryB = Category.make({
          name: `   ${name.toUpperCase()}   `,
        });

        expect(categoryA.hash).toEqual(categoryB.hash);
      });
    });
  });
});

describe("Category.validator.validate", () => {
  describe("fields:id and parentId", () => {
    it.each([
      { property: "id", errorCode: "INVALID_ID" },
      { property: "parentId", errorCode: "INVALID_PARENT_ID" },
    ])(
      `throws error with code "$errorCode" if "$property" is invalid`,
      ({ property, errorCode }) => {
        const invalidId = "non_numeric_string";

        expect(Id.isValid(invalidId)).toBeFalsy();

        const invalidCategory = {
          ...Category.make({ name: "a" }),
          [property]: invalidId,
        };
        expect(() => {
          (Category.validator.validate as any)(invalidCategory);
        }).toThrowErrorWithCode(errorCode);
      }
    );

    it('throws error with code "SELF_ID_EQUAL_PARENT_ID" if id and parentId are equal', () => {
      const currentId = +Id.makeId();
      // so the next id will be currentId + 1

      expect(() => {
        Category.make({ name: "a", parentId: (currentId + 1).toString() });
      }).toThrowErrorWithCode("SELF_ID_EQUAL_PARENT_ID");
    });

    it("does not throw error if parentId is null", () => {
      expect(() => {
        Category.make({ name: "a" });
      }).not.toThrow();
    });
  });
});

describe("Category.edit", () => {
  it(`edits a category`, () => {
    const category = Category.make({ name: "a" });

    const changes = {
      parentId: +category.id + "324",
      description: "\n\n  Desc         ",
      name: "     " + category.name + "b       \n\r",
    };

    const editedCategory = Category.edit({ category, changes });

    expect(editedCategory).toMatchObject({
      name: changes.name.trim(),
      parentId: changes.parentId,
      description: changes.description.trim(),
    });

    expect(editedCategory.hash).not.toBe(category.hash);
  });
});
