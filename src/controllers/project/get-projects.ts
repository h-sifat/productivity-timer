import type { Controller } from "../interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

export interface MakeGetProjects_Argument {
  projectService: Pick<
    ProjectServiceInterface,
    "getProjectById" | "listProjects"
  >;
}

export default function makeGetProjects(
  builderArg: MakeGetProjects_Argument
  // @ts-ignore
): Controller {
  const { projectService } = builderArg;

  /**
   * RequestURL | Method to use
   * ---------- | ------
   * get /projects | listProjects()
   * get /projects/`:id` | getProjectById(`id`)
   * */
  return async function GetProjects(request) {
    try {
      if (!("id" in request.params))
        return { body: await projectService.listProjects(), error: null };

      const id = request.params.id;
      const project = await projectService.getProjectById({ id });

      return project
        ? { body: project, error: null }
        : {
            body: {},
            error: {
              code: "NOT_FOUND",
              message: `No project found with id: "${id}"`,
            },
          };
    } catch (ex) {
      return { body: {}, error: { message: ex.message, code: ex.code } };
    }
  };
}
