import type { Command } from "commander";
import { addEditCategoryCommand } from "../edit/category";
import { addEditProjectCommand } from "../edit/project";

export function addEditCommand(program: Command) {
  const EditCommand = program
    .command("edit")
    .description("Edits a project/category");

  addEditProjectCommand(EditCommand);
  addEditCategoryCommand(EditCommand);
}
