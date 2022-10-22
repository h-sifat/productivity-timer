import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeAddProject_Argument {
  db: Pick<ProjectDatabaseInterface, "findByName" | "insert">;
}

export default function makeAddProject(
  builderArg: MakeAddProject_Argument
): ProjectServiceInterface["addProject"] {
  const { db } = builderArg;

  return async function addProject(arg) {
    const { projectInfo } = arg;

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
