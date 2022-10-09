import type {
  CurrentTimeMs,
  ConvertDuration,
  AssertValidUnixMsTimestamp,
} from "common/interfaces/date-time";
import type { ID } from "common/interfaces/id";
import type { AssertValidString } from "common/interfaces/validator";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

export type ProjectStatus = "ongoing" | "halted" | "completed";

export const VALID_PROJECT_STATUSES = Object.freeze([
  "halted",
  "ongoing",
  "completed",
] as const);

export const FIELDS_ALLOWED_TO_CHANGE = Object.freeze([
  "name",
  "status",
  "deadline",
  "categoryId",
  "description",
]);

export const ALL_FIELDS: Set<keyof ProjectFields> = new Set([
  "id",
  "name",
  "status",
  "deadline",
  "createdAt",
  "categoryId",
  "description",
]);

export type ProjectFields = Readonly<{
  id: string;
  name: string;
  createdAt: number;
  status: ProjectStatus;
  deadline: number | null;
  categoryId: string | null;
  description: string | null;
}>;

export interface ProjectValidator {
  assertValidDescription(
    description: unknown
  ): asserts description is ProjectFields["description"];

  assertValidId(id: unknown): asserts id is ProjectFields["id"];
  validate(project: object): asserts project is ProjectFields;
  assertValidName(name: unknown): asserts name is ProjectFields["name"];
  assertValidStatus(status: unknown): asserts status is ProjectFields["status"];
  assertValidCategoryId(id: unknown): asserts id is ProjectFields["categoryId"];
  assertValidDeadline(
    deadline: unknown,
    createdAt: number
  ): asserts deadline is ProjectFields["deadline"];
}

export interface MakeProject_Argument {
  name: string;
  deadline?: number | null;
  categoryId?: string | null;
  description?: string | null;
}

export interface Edit_Argument {
  project: ProjectFields;
  changes: Partial<
    Pick<
      ProjectFields,
      "name" | "description" | "deadline" | "categoryId" | "status"
    >
  >;
}

export interface ProjectEntity {
  validator: ProjectValidator;
  edit(arg: Edit_Argument): ProjectFields;
  make(arg: MakeProject_Argument): ProjectFields;
}

interface MakeProjectEntity_Argument {
  Id: ID;
  MAX_NAME_LENGTH: number;
  VALID_NAME_PATTERN: RegExp;
  currentTimeMs: CurrentTimeMs;
  MAX_DESCRIPTION_LENGTH: number;
  MIN_HOUR_BEFORE_DEADLINE: number;
  convertDuration: ConvertDuration;
  assertValidString: AssertValidString;
  MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp;
}

export default function buildProjectEntity(
  arg: MakeProjectEntity_Argument
): ProjectEntity {
  const {
    Id,
    currentTimeMs,
    MAX_NAME_LENGTH,
    convertDuration,
    VALID_NAME_PATTERN,
    MAX_DESCRIPTION_LENGTH,
    MIN_HOUR_BEFORE_DEADLINE,
    MSG_NAME_DOES_NOT_MATCH_PATTERN,
  } = arg;
  const assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp =
    arg.assertValidUnixMsTimestamp;
  const assertValidString: AssertValidString = arg.assertValidString;

  const validator: ProjectValidator = Object.freeze({
    validate,
    assertValidId,
    assertValidName,
    assertValidStatus,
    assertValidDeadline,
    assertValidCategoryId,
    assertValidDescription,
  });

  return Object.freeze({ edit, make, validator });

  function make(arg: MakeProject_Argument): ProjectFields {
    assert<object>("plain_object", arg, {
      name: "Project.make Argument",
      code: "INVALID_MAKE_PROJECT_ARGUMENT",
    });

    const project: ProjectFields = (() => {
      const {
        deadline = null,
        categoryId = null,
        description = null,
        name = required("name"),
      } = <any>arg;

      const currentTimestamp = currentTimeMs();

      const _project = {
        name,
        deadline,
        categoryId,
        description,
        id: Id.makeId(),
        status: "ongoing",
        createdAt: currentTimestamp,
      };

      validate(_project);

      return _project;
    })();

    {
      const { name, description } = project;

      return Object.freeze({
        ...project,
        name: name.trim(),
        description: description ? description.trim() : null,
      });
    }
  }

  function edit(arg: Edit_Argument): ProjectFields {
    const { project, changes } = arg;

    assert<object>("plain_object", project, {
      name: "project",
      code: "INVALID_PROJECT_ARGUMENT",
    });
    assert<object>("plain_object", changes, {
      name: "changes",
      code: "INVALID_CHANGES_ARGUMENT",
    });

    const editedProject = { ...project };

    for (const property of FIELDS_ALLOWED_TO_CHANGE)
      if (property in changes)
        // @ts-ignore
        editedProject[property] = changes[property];

    validate(editedProject);

    {
      const { name, description } = editedProject;

      return Object.freeze({
        ...editedProject,
        name: name.trim(),
        description: description ? description.trim() : null,
      });
    }
  }

  function validate(project: object): asserts project is ProjectFields {
    assert<object>("plain_object", project, {
      name: "Project",
      code: "INVALID_PROJECT",
    });

    const {
      id = required("id"),
      name = required("name"),
      status = required("status"),
      deadline = required("deadline"),
      createdAt = required("createdAt"),
      categoryId = required("categoryId"),
      description = required("description"),
    } = <any>project;

    assertValidId(id);
    assertValidName(name);
    assertValidStatus(status);
    assertValidCategoryId(categoryId);
    assertValidDescription(description);
    assertValidUnixMsTimestamp(createdAt, "INVALID_CREATION_TIMESTAMP");

    assertValidDeadline(deadline, createdAt);

    assertNoUnknownProperties(project);
  }

  function assertValidId(id: unknown): asserts id is ProjectFields["id"] {
    if (!Id.isValid(id))
      throw new EPP(`Invalid project id: ${id}.`, "INVALID_ID");
  }

  function assertValidCategoryId(
    categoryId: unknown
  ): asserts categoryId is ProjectFields["categoryId"] {
    if (categoryId !== null && !Id.isValid(categoryId))
      throw new EPP(
        `Invalid project category id: ${categoryId}.`,
        "INVALID_CATEGORY_ID"
      );
  }

  function assertValidName(
    name: unknown
  ): asserts name is ProjectFields["name"] {
    assertValidString(name, {
      name: "name",
      minLength: 1,
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
  ): asserts description is ProjectFields["description"] {
    if (description !== null)
      assertValidString(description, {
        minLength: 1,
        name: "description",
        trimBeforeLengthValidation: true,
        maxLength: MAX_DESCRIPTION_LENGTH,
      });
  }

  function assertValidStatus(
    status: unknown
  ): asserts status is ProjectFields["status"] {
    assert<string>("non_empty_string", status, {
      name: "Project.status",
      code: "INVALID_STATUS",
    });

    if (!VALID_PROJECT_STATUSES.includes(<any>status))
      throw new EPP({
        code: "INVALID_STATUS",
        message: `Invalid project status: "${status}"`,
      });
  }

  function assertValidDeadline(
    deadline: unknown,
    createdAt: number
  ): asserts deadline is ProjectFields["deadline"] {
    if (deadline === null) return;

    assertValidUnixMsTimestamp(deadline, "INVALID_DEADLINE");

    const hourLeftBeforeDeadline = convertDuration({
      toUnit: "hour",
      fromUnit: "millisecond",
      duration: <number>deadline - createdAt,
    });

    if (hourLeftBeforeDeadline < MIN_HOUR_BEFORE_DEADLINE)
      throw new EPP({
        code: "INVALID_DEADLINE",
        message: `The difference between project creation time and deadline must be greater than ${MIN_HOUR_BEFORE_DEADLINE} hour(s)`,
      });
  }

  function assertNoUnknownProperties(
    project: object
  ): asserts project is ProjectFields {
    for (const property of Object.keys(project))
      if (!ALL_FIELDS.has(property as any))
        throw new EPP({
          code: "UNKNOWN_PROPERTY",
          message: `Project contains unknown property: "${property}"`,
        });
  }
}
