import type { Command } from "commander";
import { addCreateProjectCommand } from "./project";
import { addCreateCategoryCommand } from "./category";

export function addCreateCommand(program: Command) {
  const CreateCommand = program
    .command("create")
    .description("Creates a project/category")
    .alias("c");

  addCreateCategoryCommand(CreateCommand);
  addCreateProjectCommand(CreateCommand);
}
