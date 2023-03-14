import { Command } from "commander";
import { CLI_PLUGIN_NAME } from "src/config/other";
import { addInfoCommand } from "./commands/info";

const program = new Command();

program
  .name(CLI_PLUGIN_NAME)
  .usage("<command> [args...]")
  .description("A light weight CLI for Productivity Timer to use as a plugin")
  .version(__APP_VERSION__, "-v, --version", "outputs the current version");

addInfoCommand(program);

try {
  program.parse();
} catch (ex) {
  console.error(ex.message);
  process.exit(1);
}
