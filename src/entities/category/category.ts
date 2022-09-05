import type { ID } from "common/interfaces/id";
import type {
  CurrentTimeMs,
  IsValidUnixMsTimestamp,
} from "common/interfaces/date-time";

// violation of clean architecture
import { assert } from "handy-types";
import EPP from "common/util/epp";
import required from "common/util/required";
// end of violation; LOL :')

// description is optional ic CategoryInterface
export type CategoryInterface = Readonly<{
  id: string;
  name: string;
  createdOn: number;
  modifiedOn: number;
  parentId: string | null;
  description: string | null;
}>;

type CategoryConstructor_Argument = {
  id?: string;
  name: string;
  createdOn?: number;
  modifiedOn?: number;
  parentId?: string | null;
  description?: string | null;
};

interface BuildCategoryClass_Argument {
  Id: ID;
  MAX_NAME_LENGTH: number;
  currentTimeMs: CurrentTimeMs;
  MAX_DESCRIPTION_LENGTH: number;
  isValidUnixMsTimestamp: IsValidUnixMsTimestamp;
}

export default function buildCategoryClass(arg: BuildCategoryClass_Argument) {
  const {
    Id,
    currentTimeMs,
    MAX_NAME_LENGTH,
    isValidUnixMsTimestamp,
    MAX_DESCRIPTION_LENGTH,
  } = arg;

  return class Category implements CategoryInterface {
    readonly #id: string;
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
        const { name = required("name", "MISSING_NAME_FIELD") } = arg;

        assert<string>("non_empty_string", name, {
          name: "name",
          code: "INVALID_NAME",
        });

        if (name.length > MAX_NAME_LENGTH)
          throw new EPP({
            code: "NAME_TOO_LONG",
            message: `"name" cannot be longer than ${MAX_NAME_LENGTH} characters.`,
          });

        this.#name = name;
      }

      // ----- description -----
      if ("description" in arg && arg.description !== null) {
        const description = arg.description;

        assert<string>("non_empty_string", description, {
          name: "description",
          code: "INVALID_DESCRIPTION",
        });

        if (description.length > MAX_DESCRIPTION_LENGTH)
          throw new EPP({
            code: "DESCRIPTION_TOO_LONG",
            message: `"description" cannot be longer than ${MAX_DESCRIPTION_LENGTH} characters.`,
          });

        this.#description = description;
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

      // timestamps must be provided together
      {
        const onlyOneTimestampIsPresent =
          +("createdOn" in arg) ^ +("modifiedOn" in arg);

        if (onlyOneTimestampIsPresent)
          throw new EPP({
            code: "MISSING_ANOTHER_TIMESTAMP",
            message:
              "Creation and Modification timestamps must be provided together.",
          });
      }

      // ------ createdOn ----
      if ("createdOn" in arg) {
        const createdOn = arg.createdOn;

        if (!isValidUnixMsTimestamp(createdOn))
          throw new EPP({
            code: "INVALID_CREATED_ON",
            message: `Invalid timestamp createdOn: ${createdOn}`,
          });

        this.#createdOn = createdOn;
      } else this.#createdOn = currentTimeMs();

      // ------ modifiedOn ------
      if ("modifiedOn" in arg) {
        const modifiedOn = arg.modifiedOn;

        if (!isValidUnixMsTimestamp(modifiedOn))
          throw new EPP({
            code: "INVALID_MODIFIED_ON",
            message: `Invalid timestamp modifiedOn: ${modifiedOn}`,
          });

        this.#modifiedOn = modifiedOn;
      } else this.#modifiedOn = this.#createdOn;

      if (this.#modifiedOn < this.#createdOn)
        throw new EPP({
          code: "MODIFIED_BEFORE_CREATED",
          message:
            "Category is modified be creation! Huh? Error: modifiedOn < createdOn.",
        });
    }

    #toPlainObject() {
      return {
        id: this.#id,
        name: this.#name,
        createdOn: this.#createdOn,
        modifiedOn: this.#modifiedOn,
        parentId: this.#parentId,
        description: this.#description,
      };
    }

    toPlainObject(): CategoryInterface {
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
  };
}