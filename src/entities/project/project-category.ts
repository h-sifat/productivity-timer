import type { ID } from "common/interfaces/id";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

export interface ProjectCategoryInterface {
  readonly id: string;
  readonly fullName: string;
}

interface ProjectCategoryConstructorArgument {
  id: string;
  fullName: string;
}

interface MakeProjectCategoryArgument {
  isValidId: ID["isValid"];
}

export interface ProjectCategory {
  new (arg: ProjectCategoryConstructorArgument): {
    get id(): string;
    get fullName(): string;
    toPlainObject(): ProjectCategoryInterface;
  };
}

export default function makeProjectCategoryClass(
  arg: MakeProjectCategoryArgument
): ProjectCategory {
  const { isValidId } = arg;

  return class ProjectCategory {
    readonly #id: string;
    readonly #fullName: string;

    constructor(arg: ProjectCategoryConstructorArgument) {
      assert("plain_object", arg, {
        code: "INVALID_MAIN_ARG",
        name: "The ProjectCategory constructor argument",
      });

      {
        const { id = required("id", "MISSING_ID") } = arg;

        if (!isValidId(id))
          throw new EPP({
            code: "INVALID_ID",
            message: `Invalid id for project category: ${id}`,
          });

        this.#id = id;
      }

      {
        // @ts-ignore
        const { fullName = required("fullName", "MISSING_FULLNAME") } = arg;

        assert<string>("non_empty_string", fullName, {
          name: "fullName",
          code: "INVALID_FULLNAME",
        });

        this.#fullName = fullName;
      }
    }

    get id() {
      return this.#id;
    }
    get fullName() {
      return this.#fullName;
    }

    #toPlainObject(): ProjectCategoryInterface {
      return {
        id: this.#id,
        fullName: this.#fullName,
      };
    }

    toPlainObject() {
      return Object.freeze(this.#toPlainObject());
    }

    toJSON() {
      return this.#toPlainObject();
    }
  };
}
