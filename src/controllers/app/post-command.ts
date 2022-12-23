import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";

import type { AppControllerInterface } from "./interface";

export interface makePostAppCommand_Argument {
  closeApplication(exitCode?: number): Promise<void>;
}

export function makePostAppCommand(
  factoryArg: makePostAppCommand_Argument
): AppControllerInterface["post"] {
  const CommandSchema = z.discriminatedUnion("name", [
    z.object({ name: z.literal("ping") }),
    z.object({ name: z.literal("quit") }),
  ]);

  const { closeApplication } = factoryArg;

  return async function postAppCommand(request) {
    try {
      let command: z.infer<typeof CommandSchema>;

      {
        const result = CommandSchema.safeParse(request.body);
        if (!result.success)
          throw new EPP({
            code: "INVALID_COMMAND",
            message: formatError(result.error),
          });

        command = result.data;
      }

      let message: string;
      switch (command.name) {
        case "ping":
          message = "I'm alive.";
          break;
        case "quit":
          message = "Now quitting";
          // we're setting a timeout because, if we quit instantly
          // then we won't be able to send a response of this command.
          setTimeout(closeApplication, 1000, 0); // here 0 is the exitCode
          break;
        default: {
          const __exhaustiveCheck: never = command;
          throw new Error("Should not reach here!");
        }
      }

      return { body: { success: true, data: { message } } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
