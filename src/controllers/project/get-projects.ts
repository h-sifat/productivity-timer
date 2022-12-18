import { z } from "zod";
import type { Controller } from "../interface";
import { formatError } from "common/validator/zod";
import { ProjectFields } from "entities/project/project";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

export interface MakeGetProjects_Argument {
  projectService: Pick<
    ProjectServiceInterface,
    "getProjectById" | "listProjects" | "findByName"
  >;
}

const QuerySchema = z.discriminatedUnion("lookup", [
  z.object({ lookup: z.literal("all") }).strict(),
  z
    .object({ lookup: z.literal("byId"), id: z.string().trim().min(1) })
    .strict(),
  z
    .object({ lookup: z.literal("byName"), name: z.string().trim().min(1) })
    .strict(),
]);

export default function makeGetProjects(
  builderArg: MakeGetProjects_Argument
  // @ts-ignore
): Controller {
  const { projectService } = builderArg;

  /**
   * RequestURL | Method to use
   * ---------- | ------
   * get /projects?lookup="all" | listProjects()
   * get /projects?lookup="byId"&id=<id> | getProjectById
   * get /projects?lookup="byName"&name=<name> | findByName
   * */
  return async function GetProjects(request) {
    try {
      const query = (() => {
        const result = QuerySchema.safeParse(request.query);
        if (!result.success) {
          const message = formatError(result.error);
          throw { message, code: "INVALID_QUERY" }; // will be caught below
        }

        return result.data;
      })();

      let result: ProjectFields | ProjectFields[] | null;
      switch (query.lookup) {
        case "all":
          result = await projectService.listProjects();
          break;

        case "byId":
          result = await projectService.getProjectById({ id: query.id });
          break;

        case "byName":
          result = await projectService.findByName({ name: query.name });
          break;
      }

      return { body: { success: true, data: result } };
    } catch (ex) {
      return {
        body: {
          success: false,
          error: { message: ex.message, code: ex.code },
        },
      };
    }
  };
}
