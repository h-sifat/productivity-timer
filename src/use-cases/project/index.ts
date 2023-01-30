import type {
  ProjectAddSideEffect,
  ProjectEditSideEffect,
  ProjectDeleteSideEffect,
  ProjectServiceInterface,
} from "use-cases/interfaces/project-service";
import getID from "data-access/id";
import makeAddProject from "./add-project";
import makeEditProject from "./edit-project";
import makeGetProjectMaxId from "./get-max-id";
import makeListProjects from "./list-projects";
import { makeFindByName } from "./find-by-name";
import makeGetProject from "./get-project-by-id";
import makeRemoveProject from "./remove-project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

interface MakeProjectService_Argument {
  db: ProjectDatabaseInterface;
  deleteSideEffect: ProjectDeleteSideEffect;
  postSideEffect?: ProjectAddSideEffect | undefined;
  patchSideEffect?: ProjectEditSideEffect | undefined;
}

export default function makeProjectService(
  arg: MakeProjectService_Argument
): ProjectServiceInterface {
  const { db, deleteSideEffect, postSideEffect, patchSideEffect } = arg;
  const Id = getID({ entity: "project" });
  const isValidId = Id.isValid;

  const projectService = Object.freeze({
    removeProject: makeRemoveProject({
      db,
      isValidId,
      sideEffect: deleteSideEffect,
    }),
    addProject: makeAddProject({ db, sideEffect: postSideEffect }),
    editProject: makeEditProject({
      db,
      isValidId,
      sideEffect: patchSideEffect,
    }),

    getMaxId: makeGetProjectMaxId({ db }),
    listProjects: makeListProjects({ db }),
    findByName: makeFindByName({ database: db }),
    getProjectById: makeGetProject({ db, isValidId }),
  });

  return projectService;
}
