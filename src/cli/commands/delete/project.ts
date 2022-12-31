import type { Command } from "commander";
import { printObjectAsBox } from "cli/util";
import { withClient } from "cli/util/client";
import { preprocessProject } from "cli/util/project";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

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
  await withClient(async (client) => {
    const { body } = (await client.delete(config.API_PROJECT_PATH, {
      query: { id: options.id },
    })) as any;

    if (!body.success) throw body.error;

    if (options.json) console.log(JSON.stringify(body.data));
    else printObjectAsBox({ object: preprocessProject(body.data) });
  });
}
