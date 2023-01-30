import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeEditProject from "use-cases/project/edit-project";

const db = Object.freeze({
  findById: jest.fn(),
  updateById: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;
const sideEffect = jest.fn();

const editProject = makeEditProject({ isValidId, db, sideEffect });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
  sideEffect.mockReset();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error
        await editProject(null);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_ID";

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-ignore
        await editProject({ changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_CHANGES";

    it(`throws ewc "${errorCode}" if the "changes" object is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-ignore
        await editProject({ id: "123" });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_CHANGES";

    it(`throws ewc "${errorCode}" if the property "changes" is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error changes is not a plain object
        await editProject({ id: "123", changes: [] });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_ID";

    const editProject = makeEditProject({ db, isValidId });

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(4);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await editProject({ id: invalidId, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).not.toHaveBeenCalled();
      expect(db.updateById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the project with the given id doesn't exist`, async () => {
      expect.assertions(4);

      const id = "100";
      db.findById.mockResolvedValue(null);

      try {
        await editProject({ id, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.findById).toHaveBeenCalledWith({ id });
      expect(db.updateById).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`edits a project if everything is valid`, async () => {
    const sampleProject = Project.make({ name: "Todo" });

    db.findById.mockReturnValueOnce(sampleProject);

    const edits = {
      description: "desc",
      status: "completed",
      categoryId: sampleProject.id + "12",
      name: sampleProject.name + "_changed",
      deadline: sampleProject.createdAt + 2423456241,
    } as const;

    const editedProject = await editProject({
      id: sampleProject.id,
      changes: edits,
    });

    expect(editedProject).toMatchObject({ ...sampleProject, ...edits });

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findById).toHaveBeenCalledWith({ id: sampleProject.id });

    expect(db.updateById).toHaveBeenCalledTimes(1);
    expect(db.updateById).toHaveBeenCalledWith({
      id: sampleProject.id,
      edited: { ...sampleProject, ...edits },
    });

    expect(sideEffect).toHaveBeenCalledTimes(1);
    expect(sideEffect).toHaveBeenCalledWith({
      original: sampleProject,
      updated: editedProject,
    });
  });
});
