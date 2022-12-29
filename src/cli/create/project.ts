import { Command, Option } from "commander";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { dateStringParser, formatStr, getClient } from "../util";

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
    .action(createProject);
}

export async function createProject(arg: any) {
  const client = await getClient();

  try {
    const response = await client.post(config.API_PROJECT_PATH, {
      body: arg,
      query: {},
      headers: {},
    });

    const body: any = response.body;
    if (body.success) {
      const project = body.data;

      // @TODO pretty print the project
      console.log("Created project: ", project.name);
      console.log(project);
    } else {
      const error = body.error;

      const message = `Error: ${error.message}`;
      console.log(formatStr({ string: message, color: "red" }));

      if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        console.log(
          "Either the given category does not exist or the database is corrupted."
        );
      }
      process.exitCode = 1;
    }
  } catch (ex) {
    const message = `Error: ${ex.message}`;
    console.log(formatStr({ string: message, color: "red" }));
    process.exitCode = 1;
  } finally {
    client.close();
  }
}
