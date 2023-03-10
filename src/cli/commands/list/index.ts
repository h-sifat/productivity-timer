import type { Command } from "commander";
import { addListCategoriesCommand } from "./categories";
import { addProjectListCommand } from "./projects";

export function addListCommand(program: Command) {
  const ListCommand = program
    .command("list")
    .description("Lists all projects/categories.")
    .alias("l");

  addProjectListCommand(ListCommand);
  addListCategoriesCommand(ListCommand);
}
