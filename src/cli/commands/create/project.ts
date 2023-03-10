import { Command, Option } from "commander";
import { withClient } from "cli/util/client";
import ProjectService from "client/services/project";
import { preprocessProject } from "cli/util/project";
import { dateStringParser, printObjectAsBox } from "cli/util";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addCreateProjectCommand(CreateCommand: Command) {
  CreateCommand.command("project")
    .alias("p")
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

    const projectService = new ProjectService({
      client,
      url: config.API_PROJECT_PATH,
    });

    try {
      const project = await projectService.add(makeProjectArg);
      if (printAsJson) return console.log(JSON.stringify(project));
      else printObjectAsBox({ object: preprocessProject(project) });
    } catch (ex) {
      if (ex.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        console.log(
          "Either the given category does not exist or the database is corrupted."
        );
      }
      throw ex;
    }
  });
}
