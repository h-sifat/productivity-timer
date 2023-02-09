import type { Controller } from "../interface";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import { z } from "zod";
import { formatError } from "common/validator/zod";

const QuerySchema = z.discriminatedUnion("lookup", [
  z.object({
    lookup: z.literal("work-sessions"),
    arg: z.object({
      from: z.string().min(1),
      to: z.string().min(1).optional(),
    }),
  }),
  z.object({ lookup: z.literal("stats") }),
]);

export type GetWorkSessionsQuerySchemaInterface = z.infer<typeof QuerySchema>;

export interface MakeGetWorkSessions_Argument {
  workSessionService: Pick<
    WorkSessionServiceInterface,
    "listWorkSessionsByDateRange" | "getStats"
  >;
}
export default function makeGetWorkSessions(
  builderArg: MakeGetWorkSessions_Argument
): Controller {
  const { workSessionService } = builderArg;

  return async function getWorkSessions(request) {
    try {
      const query = QuerySchema.parse(request.query);

      let data: any;
      switch (query.lookup) {
        case "work-sessions":
          data = await workSessionService.listWorkSessionsByDateRange(
            query.arg as any
          );
          break;
        case "stats":
          data = await workSessionService.getStats();
          break;

        default:
          const __exhaustiveCheck: never = query;
      }
      return { body: { success: true, data } };
    } catch (ex) {
      const message = ex instanceof z.ZodError ? formatError(ex) : ex.message;
      return {
        body: { success: false, error: { message, code: ex.code } },
      };
    }
  };
}
