import type { Command } from "commander";
import { printObjectAsBox } from "cli/util";
import { withClient } from "cli/util/client";
import CategoryService from "client/services/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { preprocessCategory, printCategoriesAsTable } from "cli/util/category";

export function addDeleteCategoryCommand(DeleteCommand: Command) {
  DeleteCommand.command("category")
    .description("Deletes a category.")
    .requiredOption("-i, --id <id>", "the id of the category")
    .option("--json", "print raw JSON.")
    .action(deleteCategory);
}

interface deleteCategory_Options {
  id: string;
  json?: true;
}
export async function deleteCategory(options: deleteCategory_Options) {
  await withClient(async (client) => {
    const categoryService = new CategoryService({
      client,
      url: config.API_CATEGORY_PATH,
    });

    const categories = await categoryService.delete({ id: options.id });

    // here body.data is an array of categories
    if (options.json) console.log(JSON.stringify(categories));
    else if (categories.length > 1) printCategoriesAsTable(categories);
    else printObjectAsBox({ object: preprocessCategory(categories[0]) });
  });
}
