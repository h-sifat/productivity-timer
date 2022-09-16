import type { MakeProject_Argument } from "entities/project/project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import Project from "entities/project";

interface MakeAddProject_Argument {
  db: Pick<ProjectDatabaseInterface, "findByName" | "insert">;
}

interface AddProject_Argument {
  projectInfo: MakeProject_Argument;
}

export default function makeAddProject(arg: MakeAddProject_Argument) {
  const { db } = arg;

  return async function addProject(arg: AddProject_Argument) {
    const { projectInfo } = arg;

    const project = Project.make(projectInfo);

    {
      const existingProject = await db.findByName({ name: project.name });
      if (existingProject) return existingProject;
    }

    await db.insert(project);
    return project;
  };
}
