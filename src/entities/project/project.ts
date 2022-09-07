import type {
  ProjectCategoryClass,
  ProjectCategoryFields,
  ProjectCategoryInterface,
} from "./project-category";
import type {
  ConvertDuration,
  IsValidUnixMsTimestamp,
  CreationAndModificationTimestampsValidator,
} from "common/interfaces/date-time";
import type { ID } from "common/interfaces/id";
import type { AssertValidString } from "common/interfaces/validator";
import type { ToPlainObject } from "common/interfaces/other";

import { assert } from "handy-types";
import EPP from "common/util/epp";
import required from "common/util/required";

// --------- end of imports -------

export type ProjectStatus = "ongoing" | "halted" | "suspended" | "completed";

export type ProjectFields = {
  id: string;
  name: string;
  createdOn: number;
  modifiedOn: number;
  deadline: number | null;
  status: ProjectStatus;
  description: string | null;
  category: Readonly<ProjectCategoryFields> | null;
};

export interface ProjectMethods {
  setDeadline(date: number): void;
  setStatus(status: ProjectStatus): void;
  toPlainObject: ToPlainObject<ProjectFields>;
}

export interface ProjectObjectInterface {
  get id(): string;
  get name(): string;
  get createdOn(): number;
  get modifiedOn(): number;
  get status(): ProjectStatus;
  get deadline(): number | null;
  get description(): string | null;
  set deadline(date: number | null);
  set status(status: ProjectStatus);
  toPlainObject: ToPlainObject<ProjectFields>;
  get category(): Readonly<ProjectCategoryFields> | null;
}

export interface ProjectConstructorArgument {
  id?: string;
  name: string;
  createdOn?: number;
  modifiedOn?: number;
  status?: ProjectStatus;
  deadline?: number | null;
  description?: string | null;
  category?: ProjectCategoryFields | null;
}

export interface ProjectClass {
  new (arg: ProjectConstructorArgument): ProjectObjectInterface;
}

interface MakeProjectClassArgument {
  Id: ID;
  MAX_NAME_LENGTH: number;
  MAX_DESCRIPTION_LENGTH: number;
  convertDuration: ConvertDuration;
  MIN_HOUR_BEFORE_DEADLINE?: number;
  assertValidString: AssertValidString;
  ProjectCategory: ProjectCategoryClass;
  isValidUnixMsTimestamp: IsValidUnixMsTimestamp;
  validateTimestamps: CreationAndModificationTimestampsValidator;
}

const VALID_PROJECT_STATUSES = Object.freeze([
  "halted",
  "ongoing",
  "suspended",
  "completed",
]);

export default function makeProjectClass(
  arg: MakeProjectClassArgument
): ProjectClass {
  const {
    Id,
    MAX_NAME_LENGTH,
    ProjectCategory,
    convertDuration,
    validateTimestamps,
    MAX_DESCRIPTION_LENGTH,
    isValidUnixMsTimestamp,
    MIN_HOUR_BEFORE_DEADLINE = 1,
  } = arg;
  const assertValidString: AssertValidString = arg.assertValidString;

  return class Project implements ProjectObjectInterface {
    #id: string;
    #name: string;
    #createdOn: number;
    #modifiedOn: number;
    #deadline: number | null = null;
    #description: string | null = null;
    #status: ProjectStatus = "ongoing";
    #category: ProjectCategoryInterface | null = null;

    constructor(arg: ProjectConstructorArgument) {
      assert("plain_object", arg, {
        code: "INVALID_MAIN_ARG",
        name: "ProjectConstructorArgument",
      });

      // ----- id ------
      {
        const { id = Id.makeId() } = arg;

        if (!Id.isValid(id))
          throw new EPP(`Invalid project id: ${id}.`, "INVALID_ID");

        this.#id = id;
      }

      // ----- name ------
      {
        const { name = required("name") } = arg;

        assertValidString(name, {
          name: "name",
          minLength: 1,
          maxLength: MAX_NAME_LENGTH,
        });

        this.#name = name;
      }

      // ----- description -------
      if ("description" in arg && arg.description !== null) {
        const { description } = arg;

        assertValidString(description, {
          minLength: 1,
          name: "description",
          maxLength: MAX_DESCRIPTION_LENGTH,
        });

        this.#description = description;
      }

      // ------- createdOn and modifiedOn -----
      {
        const timestamps = validateTimestamps({
          objectContainingTimestamps: arg,
          creationTimestampPropName: "createdOn",
          modificationTimestampPropName: "modifiedOn",
        });

        this.#createdOn = timestamps.createdOn;
        this.#modifiedOn = timestamps.modifiedOn;
      }

      // ------- other --------
      if ("status" in arg) this.#setStatus(arg.status);
      if ("deadline" in arg) this.#setDeadline(arg.deadline);
      if ("category" in arg && arg.category !== null)
        this.#category = new ProjectCategory(arg.category);
    }

    set deadline(deadline) {
      this.#setDeadline(deadline);
    }

    #setDeadline(deadline: number | null = null) {
      if (deadline === null) {
        this.#deadline = null;
        return;
      }

      if (!isValidUnixMsTimestamp(deadline))
        throw new EPP(`Invalid timestamp: ${deadline}`, "INVALID_DEADLINE");

      const hourLeftBeforeDeadline = convertDuration({
        toUnit: "hour",
        fromUnit: "millisecond",
        duration: deadline - this.#createdOn,
      });

      if (hourLeftBeforeDeadline < MIN_HOUR_BEFORE_DEADLINE)
        throw new EPP({
          code: "INVALID_DEADLINE",
          message: `The difference between project creation time and deadline must be greater than ${MIN_HOUR_BEFORE_DEADLINE} hour(s)`,
        });

      this.#deadline = deadline;
    }

    #setStatus(status: any) {
      if (!VALID_PROJECT_STATUSES.includes(status!))
        throw new EPP({
          code: "INVALID_STATUS",
          message: `Invalid project status "${status}"`,
        });

      this.#status = status;
    }

    set status(status) {
      this.#setStatus(status);
    }

    #toPlainObject() {
      return {
        id: this.#id,
        name: this.#name,
        status: this.#status,
        deadline: this.#deadline,
        createdOn: this.#createdOn,
        modifiedOn: this.#modifiedOn,
        description: this.#description,
        category: this.#category ? this.#category.toPlainObject() : null,
      };
    }

    toPlainObject(): Readonly<ProjectFields> {
      return Object.freeze(this.#toPlainObject());
    }

    toJSON() {
      const object = this.#toPlainObject();

      // @ts-ignore
      if (object.deadline) object.deadline = object.deadline.valueOf();

      return object;
    }

    get id() {
      return this.#id;
    }
    get name() {
      return this.#name;
    }
    get deadline() {
      return this.#deadline;
    }
    get createdOn() {
      return this.#createdOn;
    }
    get modifiedOn() {
      return this.#modifiedOn;
    }
    get description() {
      return this.#description;
    }
    get status() {
      return this.#status;
    }
    get category() {
      return this.#category ? this.#category.toPlainObject() : null;
    }
  };
}
