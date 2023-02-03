import type { Command } from "commander";
export function addTuiCommands(program: Command) {
  program.command("tui", "Launches the interactive Text User Interface.", {
    executableFile: "tui.js",
  });
}
