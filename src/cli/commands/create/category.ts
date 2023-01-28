import { Command } from "commander";
import { printObjectAsBox } from "cli/util";
import { withClient } from "cli/util/client";
import CategoryService from "client/services/category";
import { preprocessCategory } from "cli/util/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { MakeCategory_Argument } from "entities/category/category";

export function addCreateCategoryCommand(CreateCommand: Command) {
  CreateCommand.command("category")
    .description("Creates a new category.")
    .requiredOption("-n, --name <string>", "the name of the category")
    .option("-d, --description <string>", "the description of the category")
    .option("-p, --parent-id <string>", "the id of the parent category")
    .option("--json", "print raw JSON.")
    .action(createCategory);
}

type createCategoryOptions = MakeCategory_Argument & { json?: boolean };

export async function createCategory(options: createCategoryOptions) {
  const { json: printAsJson, ...makeCategoryArg } = options;

  await withClient(async (client) => {
    const categoryService = new CategoryService({
      client,
      url: config.API_CATEGORY_PATH,
    });
    const category = await categoryService.add(makeCategoryArg);

    if (printAsJson) return console.log(JSON.stringify(category));
    else printObjectAsBox({ object: preprocessCategory(category) });
  });
}
