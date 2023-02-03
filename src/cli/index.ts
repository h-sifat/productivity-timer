import { Command } from "commander";
import { CLI_NAME } from "src/config/other";
import { addTuiCommands } from "./commands/tui";
import { addEditCommand } from "./commands/edit";
import { addListCommand } from "./commands/list";
import { addTimerCommands } from "./commands/timer";
import { addCreateCommand } from "./commands/create";
import { addDeleteCommand } from "./commands/delete";
import { addServerRelatedCommands } from "./commands/server";

const program = new Command();

program
  .name(CLI_NAME)
  .usage("<command> [args...]")
  .description("A CLI/TUI Pomodoro timer and Todo application.")
  .version(__APP_VERSION__, "-v, --version", "outputs the current version");

// Backend And Database related: bootup, ping, quit, backup
addServerRelatedCommands(program);

// CRUD:  project/category
addEditCommand(program);
addListCommand(program);
addCreateCommand(program);
addDeleteCommand(program);

// Timer
addTimerCommands(program);

// TUI
addTuiCommands(program);

try {
  program.parse();
} catch (ex) {
  console.error(ex.message);
  process.exit(1);
}
