import {
  getClient,
  printObjectAsBox,
  formatDateProperties,
  printErrorAndSetExitCode,
} from "../util";
import {
  CategoryFields,
  MakeCategory_Argument,
} from "entities/category/category";
import { Command } from "commander";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

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
  const { json, ...makeCategoryArg } = options;

  const client = await getClient();
  try {
    const response = await client.post(config.API_CATEGORY_PATH, {
      query: {},
      headers: {},
      body: makeCategoryArg,
    });

    const body: any = response.body;
    if (!body.success) {
      printErrorAndSetExitCode(body.error);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(body.data));
      return;
    }

    const { hash: _hash, ...categoryWithoutHash } =
      formatDateProperties<CategoryFields>({
        object: body.data,
        dateProperties: ["createdAt"],
      });

    printObjectAsBox({ object: categoryWithoutHash });
  } catch (ex) {
    printErrorAndSetExitCode(ex);
  } finally {
    client.close();
  }
}
