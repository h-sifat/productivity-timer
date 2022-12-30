import { Command, Option } from "commander";
import { dateStringParser, formatStr, getClient } from "../util";

export function addEditProjectCommand(EditCommand: Command) {
  EditCommand.command("project")
    .description("Edits an existing project.")
    .option("-n, --name <string>", "the name of the project")
    .option("-d, --description <string>", "the description of the project")
    .option("--no-description", "remove the description")
    .option("-c, --category <string>", "the category id of the project")
    .option("--no-category", "remove the category")
    .addOption(
      new Option(
        "-D, --deadline <mm/dd/yyyy>",
        "the deadline of the project"
      ).argParser(dateStringParser)
    )
    .option("--no-deadline", "remove the deadline")
    .action((options) => {
      console.log(options);
    });
}
