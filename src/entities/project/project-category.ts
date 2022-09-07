import type { ID } from "common/interfaces/id";
import type { ToPlainObject } from "common/interfaces/other";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

export interface ProjectCategoryFields {
  id: string;
  fullName: string;
}

export interface ProjectCategoryMethods {
  toPlainObject: ToPlainObject<ProjectCategoryFields>;
}

export type ProjectCategoryInterface = ProjectCategoryFields &
  ProjectCategoryMethods;

export interface ProjectCategoryClass {
  new (arg: ProjectCategoryFields): {
    get id(): string;
    get fullName(): string;
    toPlainObject(): Readonly<ProjectCategoryFields>;
  };
}

interface MakeProjectCategoryArgument {
  isValidId: ID["isValid"];
}
export default function makeProjectCategoryClass(
  arg: MakeProjectCategoryArgument
): ProjectCategoryClass {
  const { isValidId } = arg;

  return class ProjectCategory {
    readonly #id: string;
    readonly #fullName: string;

    constructor(arg: ProjectCategoryFields) {
      assert("plain_object", arg, {
        code: "INVALID_MAIN_ARG",
        name: "The ProjectCategory constructor argument",
      });

      {
        const { id = required("id") } = arg;

        if (!isValidId(id))
          throw new EPP({
            code: "INVALID_ID",
            message: `Invalid id for project category: ${id}`,
          });

        this.#id = id;
      }

      {
        const { fullName = required("fullName") } = arg;

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

    #toPlainObject(): ProjectCategoryFields {
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
