import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeEditProject from "use-cases/project/edit-project";

const findById = jest.fn();
const updateById = jest.fn();
const db = Object.freeze({ findById, updateById });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockClear());
});

const editProject = makeEditProject({
  db,
  isValidId,
  getCurrentTimestamp: () => Date.now(),
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await editProject({ id: invalidId, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the project with the given id doesn't exist`, async () => {
      expect.assertions(2);

      const id = "100";

      findById.mockResolvedValueOnce(null);

      try {
        await editProject({ id, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(findById).toHaveBeenLastCalledWith({ id });
    });
  }
});

describe("Functionality", () => {
  it(`edits a project if everything is valid`, async () => {
    const createdOn = 1231231;
    const projectInfo = new Project({
      name: "Todo",
      createdOn,
      modifiedOn: createdOn,
    }).toPlainObject();

    findById.mockResolvedValueOnce(projectInfo);
    updateById.mockImplementationOnce((arg) => Promise.resolve(arg));

    const editedStatus = "completed";
    const editedProjectCategory = {
      id: "100",
      fullName: "coding/personal_projects",
    };

    const edits = {
      category: editedProjectCategory,
      status: editedStatus,
    } as const;

    const editedProject = await editProject({
      id: projectInfo.id,
      changes: edits,
    });

    expect(updateById).toHaveBeenLastCalledWith({
      id: projectInfo.id,
      projectInfo: editedProject,
    });

    expect(editedProject.modifiedOn).not.toBe(projectInfo.modifiedOn);

    expect(editedProject).toMatchObject({
      ...projectInfo,
      ...edits,
      modifiedOn: editedProject.modifiedOn,
    });
  });
});
