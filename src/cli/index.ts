import { quit } from "./quit";
import { durationParser } from "./util";
import { Option, Command } from "commander";

const program = new Command();

program
  .name("pt")
  .usage("<command> [args...]")
  .description("A CLI/TUI Pomodoro timer and Todo application.")
  .version(__APP_VERSION__, "-v, --version", "outputs the current version");

// Backend related
program.command("bootup").description("Boots up the backend application.");
program.command("reboot").description("Reboots the backend application.");
program
  .command("quit")
  .description("Closes the backend application.")
  .action(quit);

// Statistics
program.command("stats").description("Shows statistics.");

// project
const CreateCommand = program
  .command("create")
  .description("Creates a project/category");
CreateCommand.command("project").description("Create a new project.");
CreateCommand.command("category").description("Create a new category.");

const EditCommand = program
  .command("edit")
  .description("Edits a project/category");
EditCommand.command("project").description("Edits a project.");
EditCommand.command("category").description("Edits a category.");

const DeleteCommand = program
  .command("delete")
  .description("Deletes a project/category");
DeleteCommand.command("project").description("Deletes a project.");
DeleteCommand.command("category").description("Deletes a category.");

// Timer related
const DurationOption = new Option(
  "-d, --duration <number>{s|m|h}",
  "specifies the timer duration. e.g., 10m, 1h etc."
).argParser(durationParser);

program.command("pause").description("Pauses the currently running timer.");
program.command("end").description("End the currently running timer.");
program.command("info").description("Shows the timer information.");

program
  .command("reset")
  .description("Resets the countdown timer.")
  .option("-h, --hard", "resets the category/project reference", false)
  .addOption(DurationOption);

program
  .command("set-duration")
  .description("Set the timer duration while the timer is not running.");

program
  .command("start")
  .description(
    "Starts a countdown timer. The timer can be for a specific project/category or anonymous."
  )
  .addOption(
    new Option(
      "-c, --category",
      "indicates that it's a category timer"
    ).conflicts("project")
  )
  .addOption(
    new Option(
      "-p, --project",
      "indicates that it's a project timer"
    ).conflicts("category")
  )
  .addOption(
    new Option(
      "-n, --name <string>",
      "the name of the project or category"
    ).conflicts("id")
  )
  .addOption(
    new Option(
      "-i, --id <string>",
      "the id of the project or category"
    ).conflicts("name")
  )
  .addOption(DurationOption)
  .action((options) => {
    const refTypeExists = options.category || options.project;
    const nameOrIdExists = "name" in options || "id" in options;

    if (
      (refTypeExists && !nameOrIdExists) ||
      (!refTypeExists && nameOrIdExists)
    )
      throw new Error(
        "The options category/project and name/id must be specified together."
      );

    console.dir(options, { depth: null });
  });

try {
  program.parse();
} catch (ex) {
  console.error(ex.message);
  process.exit(1);
}
