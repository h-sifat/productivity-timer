import projectFixture from "fixtures/project";
import { isValid as isValidId } from "common/util/id";
import makeProjectClass, {
  ProjectFields,
  ProjectObjectInterface,
} from "entities/project/project";
import { assertValidString } from "common/validator/string";
import makeProjectCategoryClass from "entities/project/project-category";
import { convertDuration, isValidUnixMsTimestamp } from "common/util/date-time";

const MIN_HOUR_BEFORE_DEADLINE = 1;

const { validateTimestamps, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } = (() => {
  const { name, description, createdOn, modifiedOn } = projectFixture();

  const validateTimestamps = (_: any) => ({
    createdOn,
    modifiedOn,
  });

  return {
    validateTimestamps,
    MAX_NAME_LENGTH: name.length + 1,
    MAX_DESCRIPTION_LENGTH: description!.length + 1,
  };
})();

const Id = { isValid: isValidId, makeId: () => "100" };
const Project = makeProjectClass({
  Id,
  MAX_NAME_LENGTH,
  convertDuration,
  assertValidString,
  validateTimestamps,
  MAX_DESCRIPTION_LENGTH,
  isValidUnixMsTimestamp,
  MIN_HOUR_BEFORE_DEADLINE,
  ProjectCategory: makeProjectCategoryClass({ isValidId }),
});

describe("Constructor Arg Validation", () => {
  describe("mainArgObject", () => {
    {
      const errorCode = "INVALID_MAIN_ARG";

      it(`throws error with code "${errorCode}" if constructor argument is not a plain_object`, () => {
        expect(() => {
          // @ts-expect-error
          new Project(["non_a_plain_object"]);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("filed:id", () => {
    {
      const errorCode = "INVALID_ID";

      it(`should throw error with code "${errorCode}" if id is not valid`, () => {
        const invalidId = "non_numeric_string";

        expect(Id.isValid(invalidId)).toBeFalsy();

        const argWithInvalidId = projectFixture({ id: invalidId });
        expect(() => {
          new Project(argWithInvalidId);
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
        name: "a".repeat(MAX_NAME_LENGTH + 1),
        code: "NAME_TOO_LONG",
        case: "is longer than MAX_NAME_LENGTH",
      },
    ])(
      `throws error with code "$code" if name ($name) $case`,
      ({ name, code }) => {
        expect(() => {
          // @ts-ignore
          new Project(projectFixture({ name }));
        }).toThrowErrorWithCode(code);
      }
    );

    {
      const errorCode = "MISSING_NAME";
      it(`throws error with code "${errorCode}" if "name" is missing`, () => {
        const argWithNoName = projectFixture();

        // @ts-ignore
        delete argWithNoName.name;

        expect(() => {
          new Project(argWithNoName);
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
      `throws error with code "$code" if description ($description) $case`,
      ({ description, code }) => {
        expect(() => {
          // @ts-ignore
          new Project(projectFixture({ description }));
        }).toThrowErrorWithCode(code);
      }
    );

    it.each([
      {
        case: "null",
        // @ts-ignore
        arg: projectFixture({ description: null }),
      },
      {
        case: "missing",
        // @ts-ignore
        arg: (() => {
          const { description, ...rest } = projectFixture();
          return rest;
        })(),
      },
    ])("does not throw error if description is $case", ({ arg }) => {
      expect(() => {
        // @ts-ignore
        new Project(arg);
      }).not.toThrow();
    });
  });

  describe("field: status", () => {
    it(`doesn't throw error if status is not provided in the arg`, () => {
      const arg = projectFixture();

      // @ts-ignore
      delete arg.status;

      expect(() => {
        new Project(arg);
      }).not.toThrow();
    });

    it.each(["ongoing", "halted", "suspended", "completed"] as const)(
      `doesn't throw error if status is %p`,
      (status) => {
        const arg = projectFixture({ status });

        expect(() => {
          new Project(arg);
        }).not.toThrow();
      }
    );

    {
      const errorCode = "INVALID_STATUS";
      it(`throws error with code "${errorCode}" if status is invalid`, () => {
        const arg = projectFixture({
          // @ts-ignore
          status: "bla_bla_bla_probably_not_valid",
        });

        expect(() => {
          new Project(arg);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("filed:deadline", () => {
    {
      const errorCode = "INVALID_DEADLINE";
      it(`throws error with code "${errorCode}" if deadline is not a valid date`, () => {
        const arg = projectFixture({ deadline: NaN });

        expect(() => {
          new Project(arg);
        }).toThrowErrorWithCode(errorCode);
      });
    }

    {
      const errorCode = "INVALID_DEADLINE";
      it(`throws error with code ${errorCode} if hour(s) left before deadline is less than ${MIN_HOUR_BEFORE_DEADLINE}`, () => {
        const arg = projectFixture();
        arg.deadline = arg.createdOn - 100000;

        expect(() => {
          new Project(arg);
        }).toThrowErrorWithCode(errorCode);
      });
    }
  });

  describe("filed:category", () => {
    it("throws error if category is invalid", () => {
      const arg = projectFixture();

      // @ts-ignore
      arg.category.id = "non_numeric_string";
      expect(() => {
        new Project(arg);
      }).toThrow();
    });
  });

  describe("Default Values", () => {
    it.each([
      { property: "category", defaultValue: null },
      { property: "deadline", defaultValue: null },
      { property: "id", defaultValue: Id.makeId() },
      { property: "description", defaultValue: null },
      { property: "status", defaultValue: "ongoing" },
    ] as const)(
      `it sets "$property" to $defaultValue if it's not provided`,
      ({ property, defaultValue }) => {
        const arg = projectFixture();

        // @ts-ignore
        delete arg[property];

        const project = new Project(arg);

        expect(project[property]).toBe(defaultValue);
      }
    );
  });
});

describe("Other", () => {
  let project: ProjectObjectInterface;
  let arg: ProjectFields;
  beforeEach(() => {
    arg = projectFixture();
    project = new Project(arg);
  });

  it("creates a Project instance if everything is valid", () => {
    expect(project.toPlainObject()).toEqual(arg);
  });

  it("is serializable", () => {
    const stringifiedProject = JSON.stringify(project);
    expect(JSON.parse(stringifiedProject)).toEqual(arg);
  });

  describe("set status", () => {
    it("sets a new status", () => {
      expect(project.status).toBe("ongoing");
      project.status = "completed";
      expect(project.status).toBe("completed");
    });
  });

  describe("set deadline", () => {
    it("sets a new deadline", () => {
      const newDeadline = project.deadline! + 100;
      project.deadline = newDeadline;
      expect(project.deadline).toBe(newDeadline);
    });
  });
});
