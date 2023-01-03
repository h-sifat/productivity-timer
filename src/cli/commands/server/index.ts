import { pingServer } from "./ping";
import { quitServer } from "./quit";
import { bootupServer } from "./boot-up";
import type { Command } from "commander";

export function addServerRelatedCommands(program: Command) {
  program
    .command("bootup")
    .description("Boots up the backend application.")
    .action(bootupServer);
  program
    .command("ping")
    .description("Pings the backend application.")
    .action(pingServer);
  program
    .command("quit")
    .description("Closes the backend application.")
    .action(quitServer);
}
