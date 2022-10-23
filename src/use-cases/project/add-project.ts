import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import Project from "entities/project";
import required from "common/util/required";

interface MakeAddProject_Argument {
  db: Pick<ProjectDatabaseInterface, "findByName" | "insert">;
}

export default function makeAddProject(
  builderArg: MakeAddProject_Argument
): ProjectServiceInterface["addProject"] {
  const { db } = builderArg;

  return async function addProject(arg) {
    assert("plain_object", arg, {
      name: "AddProject argument",
      code: "INVALID_ARGUMENT_TYPE",
    });

    const { projectInfo = required("projectInfo", "MISSING_PROJECT_INFO") } =
      arg;

    const project = Project.make(projectInfo);

    {
      const existingProject = await db.findByName({ name: project.name });
      if (existingProject)
        throw new EPP({
          code: "DUPLICATE_NAME",
          message: `A project already exists with the name: "${project.name.toLowerCase()}" (case insensitive).`,
        });
    }

    await db.insert(project);

    return project;
  };
}
