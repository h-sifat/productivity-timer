import type { Command } from "commander";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { getClient, printErrorAndSetExitCode, printObjectAsBox } from "../util";

export function addDeleteProjectCommand(DeleteCommand: Command) {
  DeleteCommand.command("project")
    .description("Deletes a project.")
    .requiredOption("-i, --id <id>", "the id of the project")
    .option("--json", "print raw JSON.")
    .action(deleteProject);
}

interface deleteProject_Options {
  id: string;
  json?: true;
}
export async function deleteProject(options: deleteProject_Options) {
  const client = await getClient();

  try {
    const response = await client.delete(config.API_PROJECT_PATH, {
      query: { id: options.id },
    });

    const body: any = response.body;
    if (!body.success) {
      printErrorAndSetExitCode(body.error);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(body.data));
      return;
    }

    printObjectAsBox({ object: body.data });
  } catch (ex) {
    printErrorAndSetExitCode(ex);
  } finally {
    client.close();
  }
}
