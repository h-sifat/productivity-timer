import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface MakeGetProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "findById">;
}

export default function makeGetProject(
  builderArg: MakeGetProject_Argument
): ProjectServiceInterface["getProject"] {
  const { db, isValidId } = builderArg;

  return async function getProject(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "GetProject argument",
    });

    const { id = required("id") } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    return await db.findById({ id });
  };
}
