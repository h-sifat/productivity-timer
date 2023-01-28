import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { isEmptyObject } from "common/util/other";
import { setNegatedPropsToNull } from "cli/util/edit";
import CategoryService from "client/services/category";
import { preprocessCategory } from "cli/util/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { printObjectAsBox, printErrorAndSetExitCode } from "cli/util";

export function addEditCategoryCommand(EditCommand: Command) {
  EditCommand.command("category")
    .requiredOption("-i, --id <string>", "the category id")
    .option("-n, --name <string>", "the name of the category")
    .option("-d, --description <string>", "the description of the category")
    .option("--no-description", "remove the description")
    .option("-p, --parent-id <string>", "the parent id of the category")
    .option("--no-parent-id", "remove the parent id")
    .option("--json", "print raw JSON.")
    .action(editCategory);
}

interface editCategory_Options {
  id: string;
  json?: true;
  name?: string;
  parentId?: string | false;
  description?: string | false;
}
async function editCategory(options: editCategory_Options) {
  const { json: printAsJson, id, ...changes } = options;

  if (isEmptyObject(changes)) {
    printErrorAndSetExitCode({ message: `At least one option is required.` });
    return;
  }

  setNegatedPropsToNull(changes);

  await withClient(async (client) => {
    const categoryService = new CategoryService({
      client,
      url: config.API_CATEGORY_PATH,
    });

    const category = await categoryService.edit({ changes: <any>changes, id });

    if (printAsJson) console.log(JSON.stringify(category));
    else printObjectAsBox({ object: preprocessCategory(category) });
  });
}
