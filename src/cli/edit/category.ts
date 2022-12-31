import {
  getClient,
  printObjectAsBox,
  formatDateProperties,
  printErrorAndSetExitCode,
} from "../util";
import type { Command } from "commander";
import { isEmptyObject } from "common/util/other";
import type { CategoryFields } from "entities/category/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

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
  const { json, id, ...changes } = options;

  if (isEmptyObject(changes)) {
    printErrorAndSetExitCode({ message: `At least one option is required.` });
    return;
  }

  // if an option is negated (e.g., --no-description) it's value will be
  // false. So, to remove this property we've to change it to null.
  for (const [key, value] of Object.entries(changes))
    if (value === false) (<any>changes)[key] = null;

  const client = await getClient();

  try {
    const response = await client.patch(config.API_CATEGORY_PATH, {
      headers: {},
      query: { id },
      body: { changes },
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

    const { hash: _hash, ...category } = formatDateProperties<CategoryFields>({
      object: body.data,
      dateProperties: ["createdAt"],
    });
    printObjectAsBox({ object: category });
  } catch (ex) {
    printErrorAndSetExitCode(ex);
  } finally {
    client.close();
  }
}
