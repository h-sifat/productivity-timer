import type { ProjectConstructorArgument } from "entities/project/project";
import type ProjectDatabase from "use-cases/interfaces/project-db";

import Project from "entities/project";
import EPP from "common/util/epp";

interface MakeAddProject_Argument {
  db: Pick<ProjectDatabase, "findByName" | "insert">;
}

interface AddProject_Argument {
  projectInfo: ProjectConstructorArgument;
}

export default function makeAddProject(arg: MakeAddProject_Argument) {
  const { db } = arg;

  return async function addProject(arg: AddProject_Argument) {
    const { projectInfo } = arg;

    const insertingProjectRecord = new Project(projectInfo).toPlainObject();

    const existingRecord = await db.findByName({
      name: insertingProjectRecord.name,
    });

    if (existingRecord)
      try {
        return new Project(existingRecord).toPlainObject();
      } catch (ex: any) {
        const { name, id } = existingRecord;
        throw new EPP({
          code: "PROJECT_CORRUPTED_IN_DB",
          message: `The project with id: ${id} and name: "${name}" is corrupted in db.`,
          otherInfo: { projectRecord: existingRecord, reason: "INVALID_FIELD" },
        });
      }

    await db.insert({ projectInfo: insertingProjectRecord });
    return insertingProjectRecord;
  };
}
