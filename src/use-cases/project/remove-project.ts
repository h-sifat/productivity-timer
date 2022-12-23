import type {
  ProjectDeleteSideEffect,
  ProjectServiceInterface,
} from "use-cases/interfaces/project-service";
import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface MakeRemoveProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "deleteById" | "findById">;
  sideEffect: ProjectDeleteSideEffect;
}

export default function makeRemoveProject(
  builderArg: MakeRemoveProject_Argument
): ProjectServiceInterface["removeProject"] {
  const { isValidId, db, sideEffect } = builderArg;

  return async function removeProject(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "RemoveProject argument",
    });

    const { id = required("id") } = arg;
    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const project = await db.findById({ id });

    if (!project)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No project exists with the id: "${id}"`,
      });

    await db.deleteById({ id });
    await sideEffect({ id, deleted: [project] });

    return project;
  };
}
