import {
  dateStringParser,
  printObjectAsBox,
  printErrorAndSetExitCode,
} from "cli/util";
import { Command, Option } from "commander";
import { withClient } from "cli/util/client";
import { isEmptyObject } from "common/util/other";
import ProjectService from "client/services/project";
import { preprocessProject } from "cli/util/project";
import { setNegatedPropsToNull } from "cli/util/edit";
import { ProjectStatus } from "entities/project/project";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addEditProjectCommand(EditCommand: Command) {
  EditCommand.command("project")
    .description("Edits an existing project.")
    .requiredOption("-i, --id <string>", "the project id")
    .option("-n, --name <string>", "the name of the project")
    .option("-d, --description <string>", "the description of the project")
    .option("--no-description", "remove the description")
    .option("-c, --category-id <string>", "the category id of the project")
    .option("--no-category-id", "remove the category")
    .addOption(
      new Option(
        "-D, --deadline <mm/dd/yyyy>",
        "the deadline of the project"
      ).argParser(dateStringParser)
    )
    .option("--no-deadline", "remove the deadline")
    .addOption(
      new Option(
        "-s, --status <halted|ongoing|completed>",
        "the status of the project"
      ).choices(["halted", "ongoing", "completed"])
    )
    .option("--json", "print raw JSON.")
    .action(editProject);
}

type EditOptions = {
  id: string;
  name?: string;
  json?: boolean;
  status?: ProjectStatus;
  deadline?: number | false;
  createdAt?: number | false;
  categoryId?: string | false;
  description?: string | false;
};
export async function editProject(options: EditOptions) {
  const { id, json: printAsJson, ...changes } = options;

  if (isEmptyObject(changes)) {
    printErrorAndSetExitCode({ message: "At least one option is required." });
    return;
  }

  setNegatedPropsToNull(changes);

  await withClient(async (client) => {
    const projectService = new ProjectService({
      client,
      url: config.API_PROJECT_PATH,
    });

    const project = await projectService.edit({ id, changes: <any>changes });

    if (printAsJson) console.log(JSON.stringify(project));
    else printObjectAsBox({ object: preprocessProject(project) });
  });
}
