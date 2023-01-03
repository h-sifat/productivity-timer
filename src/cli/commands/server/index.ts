import { backup } from "./backup";
import { pingServer } from "./ping";
import { quitServer } from "./quit";
import type { Command } from "commander";
import { bootupServer } from "./boot-up";

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

  program
    .command("backup")
    .description("Backs up the database.")
    .action(backup);
}
