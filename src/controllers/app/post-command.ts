import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";
import type { BackupDatabase } from "data-access/backup";

import type { Response } from "../interface";
import type { AppControllerInterface } from "./interface";

export type makePostAppCommand_Argument = {
  backupDatabase: BackupDatabase;
  closeApplication(exitCode?: number): Promise<void>;
};

export function makePostAppCommand(
  factoryArg: makePostAppCommand_Argument
): AppControllerInterface["post"] {
  const CommandSchema = z.discriminatedUnion("name", [
    z.object({ name: z.literal("ping") }),
    z.object({ name: z.literal("quit") }),
    z.object({ name: z.literal("backup") }),
  ]);

  const { closeApplication, backupDatabase } = factoryArg;

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

      let body: Response["body"];
      switch (command.name) {
        case "ping":
          body = { success: true, data: { message: "I'm alive" } };
          break;
        case "quit":
          body = { success: true, data: { message: "Now quitting" } };
          // we're setting a timeout because, if we quit instantly
          // then we won't be able to send a response of this command.
          setTimeout(closeApplication, 100, 0); // here 0 is the exitCode
          break;

        case "backup":
          {
            const result = await backupDatabase({ notifyError: false });
            body = result.success
              ? { success: true, data: { message: "Backup completed." } }
              : {
                  success: false,
                  error: {
                    message:
                      "Could not backup database. Please see error logs.",
                    code: "BACKUP_FAILED",
                  },
                };
          }
          break;

        default: {
          const __exhaustiveCheck: never = command;
          throw new Error("Should not reach here!");
        }
      }

      return { body };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
