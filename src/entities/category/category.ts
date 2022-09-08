import type { ID } from "common/interfaces/id";
import type { ToPlainObject } from "common/interfaces/other";
import type { AssertValidString } from "common/interfaces/validator";
import type { CreationAndModificationTimestampsValidator } from "common/interfaces/date-time";

// violation of clean architecture
import { assert } from "handy-types";
import EPP from "common/util/epp";
import required from "common/util/required";
// end of violation; LOL :')

export interface CategoryFields {
  id: string;
  name: string;
  hash: string;
  createdOn: number;
  modifiedOn: number;
  parentId: string | null;
  description: string | null;
}

export type CategoryInterface = Readonly<{
  get id(): string;
  get name(): string;
  get hash(): string;
  get createdOn(): number;
  get modifiedOn(): number;
  get parentId(): string | null;
  get description(): string | null;
  toPlainObject: ToPlainObject<CategoryFields>;
}>;

export type CategoryConstructor_Argument = Partial<
  Omit<CategoryFields, "name" | "hash">
> &
  Pick<CategoryFields, "name">;

export interface CategoryClass {
  new (arg: CategoryConstructor_Argument): CategoryInterface;
}

interface BuildCategoryClass_Argument {
  Id: ID;
  MAX_NAME_LENGTH: number;
  MAX_DESCRIPTION_LENGTH: number;
  createHash(arg: string): string;
  assertValidString: AssertValidString;
  creationAndModificationTimestampsValidator: CreationAndModificationTimestampsValidator;
}

export default function makeCategoryClass(
  arg: BuildCategoryClass_Argument
): CategoryClass {
  const {
    Id,
    createHash,
    MAX_NAME_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    creationAndModificationTimestampsValidator,
  } = arg;

  const assertValidString: AssertValidString = arg.assertValidString;

  return class Category implements CategoryInterface {
    readonly #id: string;
    readonly #hash: string;
    readonly #name: string;
    readonly #createdOn: number;
    readonly #modifiedOn: number;
    readonly #parentId: string | null = null;
    readonly #description: string | null = null;

    constructor(arg: CategoryConstructor_Argument) {
      assert("plain_object", arg, {
        code: "INVALID_MAIN_ARG",
        name: "CategoryConstructor_Argument",
      });

      // ----- name ------
      {
        const { name = required("name") } = arg;

        assertValidString(name, {
          minLength: 1,
          name: "name",
          maxLength: MAX_NAME_LENGTH,
          trimBeforeLengthValidation: true,
        });

        if (name.includes("/"))
          throw new EPP({
            code: "INVALID_NAME",
            message: `A category name must not contain backslash (/)`,
          });

        this.#name = name.trim();
      }

      // ----- description -----
      if ("description" in arg && arg.description !== null) {
        const description = arg.description;

        assertValidString(description, {
          minLength: 1,
          name: "description",
          trimBeforeLengthValidation: true,
          maxLength: MAX_DESCRIPTION_LENGTH,
        });

        this.#description = description.trim();
      }

      // ----- id ------
      {
        const { id = Id.makeId() } = arg;

        if (!Id.isValid(id))
          throw new EPP(`Invalid category id: ${id}.`, "INVALID_ID");

        this.#id = id;
      }

      // ----- parentId ---
      if ("parentId" in arg) {
        const parentId = arg.parentId;

        if (parentId !== null && !Id.isValid(parentId))
          throw new EPP({
            code: "INVALID_PARENT_ID",
            message: `Invalid category parentId: ${parentId}.`,
          });

        this.#parentId = parentId;
      }

      if (this.#id === this.#parentId)
        throw new EPP({
          code: "SELF_ID_EQUAL_PARENT_ID",
          message: `"id" and "parentId" cannot be the same.`,
        });

      {
        const timestamps = creationAndModificationTimestampsValidator({
          creationTimestampPropName: "createdOn",
          modificationTimestampPropName: "modifiedOn",
          objectContainingTimestamps: arg,
        });

        this.#createdOn = timestamps.createdOn;
        this.#modifiedOn = timestamps.modifiedOn;
      }

      {
        const hashingText = String(this.#parentId) + this.#name.toLowerCase();
        this.#hash = createHash(hashingText);
      }
    }

    #toPlainObject() {
      return {
        id: this.#id,
        hash: this.#hash,
        name: this.#name,
        parentId: this.#parentId,
        createdOn: this.#createdOn,
        modifiedOn: this.#modifiedOn,
        description: this.#description,
      };
    }

    toPlainObject(): Readonly<CategoryFields> {
      return Object.freeze(this.#toPlainObject());
    }

    toJSON() {
      return this.#toPlainObject();
    }

    // ----- Getters ----
    get id() {
      return this.#id;
    }
    get name() {
      return this.#name;
    }
    get createdOn() {
      return this.#createdOn;
    }
    get modifiedOn() {
      return this.#modifiedOn;
    }
    get parentId() {
      return this.#parentId;
    }
    get description() {
      return this.#description;
    }
    get hash() {
      return this.#hash;
    }
  };
}
