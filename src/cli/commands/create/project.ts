import { Command, Option } from "commander";
import { withClient } from "cli/util/client";
import { preprocessProject } from "cli/util/project";
import { dateStringParser, printObjectAsBox } from "cli/util";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addCreateProjectCommand(CreateCommand: Command) {
  CreateCommand.command("project")
    .description("Create a new project.")
    .requiredOption("-n, --name <string>", "the name of the project")
    .option("-d, --description <string>", "the description of the project")
    .option("-c, --category-id <string>", "the category id of the project")
    .addOption(
      new Option(
        "-D, --deadline <mm/dd/yyyy>",
        "the deadline of the project"
      ).argParser(dateStringParser)
    )
    .option("--json", "print raw JSON.")
    .action(createProject);
}

export async function createProject(options: any) {
  await withClient(async (client) => {
    const { json: printAsJson, ...makeProjectArg } = options;
    const { body } = (await client.post(config.API_PROJECT_PATH, {
      query: {},
      headers: {},
      body: makeProjectArg,
    })) as any;

    if (!body.success) {
      if (body.error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        console.log(
          "Either the given category does not exist or the database is corrupted."
        );
      }
      throw body.error;
    }

    if (printAsJson) return console.log(JSON.stringify(body.data));
    else printObjectAsBox({ object: preprocessProject(body.data) });
  });
}
