import type { ID } from "common/interfaces/id";
import type { AssertValidString } from "common/interfaces/validator";
import type { AssertValidUnixMsTimestamp } from "common/interfaces/date-time";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

export const ALL_FIELDS: Set<keyof CategoryFields> = new Set([
  "id",
  "hash",
  "name",
  "parentId",
  "createdOn",
  "description",
] as const);

export const FIELDS_ALLOWED_TO_CHANGE = Object.freeze([
  "name",
  "parentId",
  "description",
] as const);

export type CategoryFields = Readonly<{
  id: string;
  name: string;
  hash: string;
  createdOn: number;
  parentId: string | null;
  description: string | null;
}>;

export interface CategoryValidator {
  assertValidId(
    id: unknown,
    parentId: CategoryFields["parentId"]
  ): asserts id is CategoryFields["id"];

  assertValidParentId(
    parentId: unknown
  ): asserts parentId is CategoryFields["parentId"];

  assertValidDescription(
    description: unknown
  ): asserts description is CategoryFields["description"];

  validate(category: object): asserts category is CategoryFields;
  assertValidName(name: unknown): asserts name is CategoryFields["name"];
}

export interface MakeCategory_Argument {
  name: string;
  parentId?: string;
  description?: string;
}

interface BuildCategoryEntity_Argument {
  Id: ID;
  MAX_NAME_LENGTH: number;
  currentTimeMs(): number;
  VALID_NAME_PATTERN: RegExp;
  MAX_DESCRIPTION_LENGTH: number;
  createHash(arg: string): string;
  assertValidString: AssertValidString;
  MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp;
}

export interface Edit_Argument {
  category: CategoryFields;
  changes: Partial<Pick<CategoryFields, "name" | "description" | "parentId">>;
}

export interface CategoryEntity {
  validator: CategoryValidator;
  edit(arg: Edit_Argument): CategoryFields;
  make(arg: MakeCategory_Argument): CategoryFields;
}

export default function buildCategoryEntity(
  arg: BuildCategoryEntity_Argument
): CategoryEntity {
  const {
    Id,
    createHash,
    currentTimeMs,
    MAX_NAME_LENGTH,
    VALID_NAME_PATTERN,
    MAX_DESCRIPTION_LENGTH,
    MSG_NAME_DOES_NOT_MATCH_PATTERN,
  } = arg;
  const assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp =
    arg.assertValidUnixMsTimestamp;
  const assertValidString: AssertValidString = arg.assertValidString;
  // end of dependencies

  const validator: CategoryEntity["validator"] = Object.freeze({
    validate,
    assertValidId,
    assertValidName,
    assertValidParentId,
    assertValidDescription,
  });

  return Object.freeze({ make, edit, validator });

  function make(arg: MakeCategory_Argument): CategoryFields {
    assert<object>("plain_object", arg, {
      code: "INVALID_MAKE_ARG",
      name: "Category.make argument",
    });

    const category: CategoryFields = (() => {
      const {
        parentId = null,
        description = null,
        name = required("name"),
      } = arg;

      const _category = {
        name,
        parentId,
        description,
        id: Id.makeId(),
        createdOn: currentTimeMs(),
        hash: "h", // will be generated later
      };

      validate(_category, { validateHash: false });

      return _category;
    })();

    {
      const { description, parentId } = category;
      const name = category.name.trim();

      return Object.freeze({
        ...category,
        name,
        hash: generateCategoryHash({ name, parentId }),
        description: description ? description.trim() : null,
      });
    }
  }

  function edit(arg: Edit_Argument): CategoryFields {
    const { category, changes } = arg;

    assert<object>("plain_object", category, {
      name: "project",
      code: "INVALID_CATEGORY_ARGUMENT",
    });
    assert<object>("plain_object", changes, {
      name: "changes",
      code: "INVALID_CHANGES_ARGUMENT",
    });

    const editedCategory = { ...category };

    for (const property of FIELDS_ALLOWED_TO_CHANGE)
      if (property in changes)
        // @ts-ignore
        editedCategory[property] = changes[property];

    validate(editedCategory, { validateHash: false });

    {
      const { parentId, description } = editedCategory;
      const name = editedCategory.name.trim();

      return Object.freeze({
        ...editedCategory,
        name,
        hash: generateCategoryHash({ name, parentId }),
        description: description ? description.trim() : null,
      });
    }
  }

  function validate(
    category: unknown,
    options: { validateHash?: boolean } = {}
  ): asserts category is CategoryFields {
    assert<object>("plain_object", category, {
      name: "Category",
      code: "INVALID_CATEGORY",
    });

    const {
      hash = required("hash"),
      name = required("name"),
      parentId = required("parentId"),
    } = category as any;

    {
      const {
        id = required("id"),
        createdOn = required("createdOn"),
        description = required("description"),
      } = category as any;

      assertValidParentId(parentId);
      assertValidId(id, parentId);

      assertValidName(name);
      assertValidDescription(description);
      assertValidUnixMsTimestamp(createdOn);
    }

    if (options.validateHash) {
      const generatedHash = generateCategoryHash({ name, parentId });

      if (generatedHash !== hash)
        throw new EPP({
          code: "HASH_MISMATCH",
          message: `The generated hash doesn't match the existing hash`,
        });
    }

    assertNoUnknownProperties(category);
  }

  function assertValidName(
    name: unknown
  ): asserts name is CategoryFields["name"] {
    assertValidString(name, {
      minLength: 1,
      name: "name",
      maxLength: MAX_NAME_LENGTH,
      trimBeforeLengthValidation: true,
    });

    if (!VALID_NAME_PATTERN.test(name.trim()))
      throw new EPP({
        code: "INVALID_NAME",
        message: MSG_NAME_DOES_NOT_MATCH_PATTERN,
      });
  }

  function assertValidDescription(
    description: unknown
  ): asserts description is CategoryFields["description"] {
    if (description !== null)
      assertValidString(description, {
        minLength: 1,
        name: "description",
        trimBeforeLengthValidation: true,
        maxLength: MAX_DESCRIPTION_LENGTH,
      });
  }

  function assertValidId(
    id: unknown,
    parentId: CategoryFields["parentId"]
  ): asserts id is CategoryFields["id"] {
    if (!Id.isValid(id))
      throw new EPP(`Invalid category id: ${id}.`, "INVALID_ID");

    if (id === parentId)
      throw new EPP({
        code: "SELF_ID_EQUAL_PARENT_ID",
        message: `"id" and "parentId" cannot be the same.`,
      });
  }

  function assertValidParentId(
    parentId: unknown
  ): asserts parentId is CategoryFields["parentId"] {
    if (parentId !== null && !Id.isValid(parentId))
      throw new EPP(`Invalid category id: ${parentId}.`, "INVALID_PARENT_ID");
  }

  function generateCategoryHash(arg: { name: any; parentId: any }): string {
    const { parentId, name } = arg;

    const hashingText = String(parentId) + String(name).toLowerCase();
    return createHash(hashingText);
  }

  function assertNoUnknownProperties(
    category: object
  ): asserts category is CategoryFields {
    for (const property of Object.keys(category))
      if (!ALL_FIELDS.has(property as any))
        throw new EPP({
          code: "UNKNOWN_PROPERTY",
          message: `Category contains unknown property: "${property}"`,
        });
  }
}
