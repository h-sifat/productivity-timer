import type { ProjectFields } from "entities/project/project";
import type ProjectDatabase from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeListProjects_Argument {
  db: Pick<ProjectDatabase, "findAll">;
}

interface ListProjects_Result {
  projects: Readonly<ProjectFields>[];
  corrupted: {
    error: EPP;
    record: Partial<ProjectFields>;
  }[];
}

export default function makeListProjects(arg: MakeListProjects_Argument) {
  const { db } = arg;

  return async function listProjects(): Promise<ListProjects_Result> {
    const projectRecords = await db.findAll();

    const result: ListProjects_Result = {
      projects: [],
      corrupted: [],
    };

    for (const record of projectRecords)
      try {
        result.projects.push(new Project(record).toPlainObject());
      } catch (ex: any) {
        result.corrupted.push({ record, error: ex });
      }

    return result;
  };
}
