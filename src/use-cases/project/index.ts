import getID from "data-access/id";
import makeAddProject from "./add-project";
import makeGetProject from "./get-project";
import makeEditProject from "./edit-project";
import makeGetProjectMaxId from "./get-max-id";
import makeListProjects from "./list-projects";
import makeRemoveProject from "./remove-project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import { ProjectServiceInterface } from "use-cases/interfaces/project-service";

interface MakeProjectService_Argument {
  db: ProjectDatabaseInterface;
}

export default function makeProjectService(
  arg: MakeProjectService_Argument
): ProjectServiceInterface {
  const { db } = arg;
  const Id = getID({ entity: "project" });
  const isValidId = Id.isValid;

  const projectService = Object.freeze({
    addProject: makeAddProject({ db }),
    getMaxId: makeGetProjectMaxId({ db }),
    listProjects: makeListProjects({ db }),
    getProjectMaxId: makeGetProjectMaxId({ db }),
    getProject: makeGetProject({ db, isValidId }),
    editProject: makeEditProject({ db, isValidId }),
    removeProject: makeRemoveProject({ db, isValidId }),
  });

  return projectService;
}
