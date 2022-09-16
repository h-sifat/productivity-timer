import { isValid } from "common/util/id";
import { ID } from "common/interfaces/id";
import { assertValidString } from "common/validator/string";
import {
  convertDuration,
  assertValidUnixMsTimestamp,
} from "common/util/date-time";
import buildProjectEntity, { ProjectEntity } from "entities/project/project";

const MAX_NAME_LENGTH = 5;
const MAX_DESCRIPTION_LENGTH = 20;
const MIN_HOUR_BEFORE_DEADLINE = 1;
const VALID_NAME_PATTERN = /^[\w ]+$/;
const MSG_NAME_DOES_NOT_MATCH_PATTERN =
  "Project name must only consist of alphanumeric and whitespace characters";

const Id: ID = (() => {
  let id = 1;
  return Object.freeze({ isValid, makeId: () => (id++).toString() });
})();

const currentTimeMs = (() => {
  let time = Date.now();
  return () => ++time;
})();

const Project = buildProjectEntity({
  Id,
  currentTimeMs,
  MAX_NAME_LENGTH,
  convertDuration,
  assertValidString,
  VALID_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH,
  MIN_HOUR_BEFORE_DEADLINE,
  assertValidUnixMsTimestamp,
  MSG_NAME_DOES_NOT_MATCH_PATTERN,
});

const validateProject: ProjectEntity["validator"]["validate"] =
  Project.validator.validate;

const SAMPLE_PROJECT = Project.make({
  name: "Todo",
  categoryId: "100",
  description: "desc",
});

describe("-------[Project.validator.validate]-------", () => {
  describe("main argument", () => {
    {
      const errorCode = "INVALID_PROJECT";

      it(`throws ewc "${errorCode}" if the argument is not a plain_object`, () => {
        expect(() => {
          // @ts-expect-error
          validateProject(null);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("field:id", () => {
    {
      const errorCode = "INVALID_ID";

      it(`should throw ewc "${errorCode}" if id is not valid`, () => {
        const invalidId = "non_numeric_string";
        expect(Id.isValid(invalidId)).toBeFalsy();

        expect(() => {
          // @ts-ignore
          validateProject({ ...SAMPLE_PROJECT, id: invalidId });
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("field:name", () => {
    it.each([
      {
        name: 2334,
        code: "INVALID_NAME",
        case: "is not a non_empty_string",
      },
      {
        name: "",
        code: "NAME_TOO_SHORT",
        case: "is not a non_empty_string",
      },
      {
        name: "   \n\r\n    ", // it will be trimmed
        code: "NAME_TOO_SHORT",
        case: "is not a non_empty_string",
      },
      {
        name: "!@#",
        code: "INVALID_NAME", // according to the pattern: VALID_NAME_PATTERN
        case: "contains non alphanumeric character",
      },
      {
        name: "a".repeat(MAX_NAME_LENGTH + 1),
        code: "NAME_TOO_LONG",
        case: "is longer than MAX_NAME_LENGTH",
      },
    ])(`throws ewc "$code" if name ($name) $case`, ({ name, code }) => {
      expect(() => {
        // @ts-ignore
        validateProject({ ...SAMPLE_PROJECT, name });
      }).toThrowErrorWithCode(code);
    });

    {
      const errorCode = "MISSING_NAME";
      it(`throws ewc "${errorCode}" if "name" is missing`, () => {
        const invalidProject = { ...SAMPLE_PROJECT };

        // @ts-ignore
        delete invalidProject.name;

        expect(() => {
          validateProject(invalidProject);
        }).toThrowErrorWithCode(errorCode);
      });
    }
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
      `throws ewc "$code" if description ($description) $case`,
      ({ description, code }) => {
        expect(() => {
          // @ts-ignore
          validateProject({ ...SAMPLE_PROJECT, description });
        }).toThrowErrorWithCode(code);
      }
    );

    it(`doesn't throw if description is null`, () => {
      const project = { ...SAMPLE_PROJECT, description: null };
      expect(() => {
        validateProject(project);
      }).not.toThrow();
    });
  });

  describe("field: status", () => {
    it.each(["ongoing", "halted", "completed"] as const)(
      `doesn't throw error if status is %p`,
      (status) => {
        const project = { ...SAMPLE_PROJECT, status };

        expect(() => {
          validateProject(project);
        }).not.toThrow();
      }
    );

    {
      const errorCode = "INVALID_STATUS";
      it(`throws ewc "${errorCode}" if status is invalid`, () => {
        const projectWithInvalidStatus = {
          ...SAMPLE_PROJECT,
          status: "bla_bla_bla_probably_not_valid",
        };

        expect(() => {
          validateProject(projectWithInvalidStatus);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("field:deadline", () => {
    const errorCode = "INVALID_DEADLINE";
    it(`throws ewc "${errorCode}" if deadline is not a valid date`, () => {
      const project = { ...SAMPLE_PROJECT, deadline: NaN };

      expect(() => {
        validateProject(project);
      }).toThrowErrorWithCode(errorCode);
    });

    it(`throws ewc ${errorCode} if hour(s) left before deadline is less than ${MIN_HOUR_BEFORE_DEADLINE}`, () => {
      const project = {
        ...SAMPLE_PROJECT,
        deadline: SAMPLE_PROJECT.createdOn - 100000000,
      };

      expect(() => {
        validateProject(project);
      }).toThrowErrorWithCode(errorCode);
    });
  });

  describe("field:category", () => {
    it("throws error if category id is invalid", () => {
      const project = { ...SAMPLE_PROJECT, categoryId: "non_numeric_string" };

      expect(() => {
        validateProject(project);
      }).toThrow();
    });
  });

  describe("field:categoryId", () => {
    it(`doesn't throw error if categoryId is null`, () => {
      expect(() => {
        validateProject({ ...SAMPLE_PROJECT, categoryId: null });
      }).not.toThrow();
    });

    {
      const errorCode = "INVALID_CATEGORY_ID";
      it(`throws ewc "${errorCode}" if categoryId is invalid`, () => {
        const invalidCategoryId = "non_numeric_string";
        expect(Id.isValid(invalidCategoryId)).toBeFalsy();

        expect(() => {
          // @ts-ignore
          validateProject({ ...SAMPLE_PROJECT, categoryId: invalidCategoryId });
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("Other", () => {
    {
      const errorCode = "UNKNOWN_PROPERTY";
      it(`throws ewc "${errorCode}" if project contains unknown properties`, () => {
        const invalidProject = { ...SAMPLE_PROJECT, duck_quack_quack: ":(" };

        expect(() => {
          validateProject(invalidProject);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });
});

describe("-----[Project.make]-----", () => {
  describe("main argument", () => {
    const errorCode = "INVALID_MAKE_PROJECT_ARGUMENT";

    it(`throws ewc "${errorCode}" is the main argument is not a plain_object`, () => {
      expect(() => {
        // @ts-ignore
        Project.make(["hello"]);
      }).toThrowErrorWithCode(errorCode);
    });
  });

  describe("Defaults Values", () => {
    it(`sets default value (null) to categoryId, description, and deadline if not provide`, () => {
      expect(Project.make({ name: "a" })).toMatchObject({
        deadline: null,
        categoryId: null,
        description: null,
      });
    });

    it(`sets status to "ongoing" for new project`, () => {
      const project = Project.make({ name: "a" });
      expect(project.status).toBe("ongoing");
    });
  });

  describe("Formatting", () => {
    it.each([
      { property: "name", value: "    name  \n " },
      { property: "description", value: "\n\r    desc  \n " },
    ] as const)(
      `it trims whitespace from "$property"`,
      ({ property, value }) => {
        const project = Project.make({ ...SAMPLE_PROJECT, [property]: value });

        expect(project[property]).toBe(value.trim());
      }
    );
  });

  describe("Other", () => {
    it(`creates a project if everything is valid`, () => {
      const name = "a";
      const description = "desc";
      const categoryId = Id.makeId();
      const deadline =
        currentTimeMs() +
        convertDuration({
          fromUnit: "hour",
          toUnit: "millisecond",
          duration: MIN_HOUR_BEFORE_DEADLINE * 5,
        });

      const project = Project.make({
        name,
        deadline,
        categoryId,
        description,
      });

      expect(project).toEqual({
        name,
        deadline,
        categoryId,
        description,
        status: "ongoing",
        id: expect.any(String),
        createdOn: expect.any(Number),
      });
    });
  });
});

describe("----[Project.edit]-----", () => {
  describe("argument validation", () => {
    {
      const errorCode = "INVALID_PROJECT_ARGUMENT";

      it(`throws ewc "${errorCode}" is arg.project is not a plain_object`, () => {
        expect(() => {
          // @ts-ignore
          Project.edit({ project: 12312, changes: {} });
        }).toThrowErrorWithCode(errorCode);
      });
    }

    {
      const errorCode = "INVALID_CHANGES_ARGUMENT";

      it(`throws ewc "${errorCode}" is arg.changes is not a plain_object`, () => {
        expect(() => {
          // @ts-ignore
          Project.edit({ project: {}, changes: ["not a plain_object"] });
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("Applying Edits", () => {
    it(`only picks properties that are allowed to change from the changes object`, () => {
      const project = { ...SAMPLE_PROJECT };

      const invalidProperty = "duck";
      const editedProject = Project.edit({
        project,
        // @ts-ignore I know that duck is not a valid field  for a project
        changes: { [invalidProperty]: "quack" },
      });

      // the change should not be applied
      expect(editedProject).not.toHaveProperty(invalidProperty);
      expect(editedProject).toEqual(project);
    });

    it(`edits a project if everything is valid`, () => {
      const changes = {
        name: "a",
        description: "desc",
        categoryId: Id.makeId(),
        deadline:
          SAMPLE_PROJECT.createdOn +
          convertDuration({
            fromUnit: "hour",
            toUnit: "millisecond",
            duration: MIN_HOUR_BEFORE_DEADLINE * 5,
          }),
      };
      const editedProject = Project.edit({ project: SAMPLE_PROJECT, changes });

      expect(editedProject).toMatchObject(changes);
    });
  });

  describe("Formatting", () => {
    it.each([
      { property: "name", value: "    name  \n " },
      { property: "description", value: "\n\r    desc  \n " },
    ] as const)(
      `it trims whitespace from "$property"`,
      ({ property, value }) => {
        const project = Project.edit({
          project: SAMPLE_PROJECT,
          changes: { [property]: value },
        });

        expect(project[property]).toBe(value.trim());
      }
    );
  });
});
