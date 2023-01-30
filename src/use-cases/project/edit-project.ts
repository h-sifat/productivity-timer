import type {
  ProjectEditSideEffect,
  ProjectServiceInterface,
} from "use-cases/interfaces/project-service";
import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import Project from "entities/project";
import required from "common/util/required";

interface MakeEditProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "findById" | "updateById">;
  sideEffect?: ProjectEditSideEffect | undefined;
}

export default function makeEditProject(
  builderArg: MakeEditProject_Argument
): ProjectServiceInterface["editProject"] {
  const { isValidId, db } = builderArg;

  return async function editProject(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "EditProject argument",
    });

    const { id = required("id"), changes = required("changes") } = arg;
    assert("plain_object", changes, {
      code: "INVALID_CHANGES",
      name: "Argument.changes",
    });

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const project = await db.findById({ id });

    if (!project)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No project exist with id: "${id}"`,
      });

    {
      const editedProject = Project.edit({ project, changes });
      await db.updateById({ id, edited: editedProject });

      if (builderArg.sideEffect)
        builderArg.sideEffect({ original: project, updated: editedProject });

      return editedProject;
    }
  };
}
