import type { Command } from "commander";
import { addDeleteCategoryCommand } from "./category";
import { addDeleteProjectCommand } from "./project";

export function addDeleteCommand(program: Command) {
  const DeleteCommand = program
    .command("delete")
    .description("Deletes a project/category")
    .alias("d");
  addDeleteProjectCommand(DeleteCommand);
  addDeleteCategoryCommand(DeleteCommand);
}
