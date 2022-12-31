import {
  getClient,
  dateStringParser,
  printObjectAsBox,
  formatDateProperties,
  printErrorAndSetExitCode,
} from "../util";
import { Command, Option } from "commander";
import { isEmptyObject } from "common/util/other";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { ProjectFields, ProjectStatus } from "entities/project/project";

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
  const client = await getClient();

  try {
    const { id, json, ...changes } = options;

    if (isEmptyObject(changes)) {
      printErrorAndSetExitCode({ message: "At least one option is required." });
      return;
    }

    // if an option is negated (e.g., --no-description) it's value will be
    // false. So, to remove this property we've to change it to null.
    for (const [key, value] of Object.entries(changes))
      if (value === false) (<any>changes)[key] = null;

    const response = await client.patch(config.API_PROJECT_PATH, {
      headers: {},
      body: { changes },
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

    const project = formatDateProperties<ProjectFields>({
      object: body.data,
      dateProperties: ["createdAt", "deadline"],
    });
    printObjectAsBox({ object: project });
  } catch (ex) {
    printErrorAndSetExitCode(ex);
  } finally {
    client.close();
  }
}
