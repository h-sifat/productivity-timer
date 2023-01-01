import type { Command } from "commander";
import { printObjectAsBox } from "cli/util";
import { withClient } from "cli/util/client";
import { preprocessCategory, printCategoriesAsTable } from "cli/util/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

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
    const { body } = (await client.delete(config.API_CATEGORY_PATH, {
      query: { id: options.id },
    })) as any;

    if (!body.success) throw body.error;

    // here body.data is an array of categories
    if (options.json) console.log(JSON.stringify(body.data));
    else if (body.data.length > 1) printCategoriesAsTable(body.data);
    else printObjectAsBox({ object: preprocessCategory(body.data[0]) });
  });
}
