import EPP from "common/util/epp";
import { printTables } from "./table";
import type { Client } from "express-ipc";
import { formatDateProperties } from "cli/util";
import type { CategoryFields } from "entities/category/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function preprocessCategory(category: any): any {
  const { hash: _hash, ...categoryWithoutHash } =
    formatDateProperties<CategoryFields>({
      object: category,
      dateProperties: ["createdAt"],
    });

  return categoryWithoutHash;
}

export function printCategoriesAsTable(categories: CategoryFields[]) {
  printTables({
    columns: ["id", "name", "parentId", "createdAt", "description"],
    objects: categories.map(preprocessCategory),
  });
}

interface getCategoryById_Arg {
  id: string;
  client: Client;
  throwIfNotFound?: boolean;
}
export async function getCategoryById(
  arg: getCategoryById_Arg
): Promise<CategoryFields> {
  const { id, throwIfNotFound = false, client } = arg;

  const { body } = (await client.get(config.API_CATEGORY_PATH, {
    query: { lookup: "selfById", id },
  })) as any;

  if (!body.success) throw body.error;

  const category = body.data;
  if (!category && throwIfNotFound)
    throw new EPP({
      code: "NOT_FOUND",
      message: `No category found with the id: "${id}"`,
    });

  return category;
}

interface getCategoryByName_Arg {
  name: string;
  client: Client;
  throwIfNotFound?: boolean;
}
export async function getCategoryByName(
  arg: getCategoryByName_Arg
): Promise<CategoryFields[]> {
  const { name, client, throwIfNotFound = false } = arg;

  const { body } = (await client.get(config.API_CATEGORY_PATH, {
    query: { lookup: "selfByName", name },
  })) as any;

  if (!body.success) throw body.error;

  const categories = body.data;
  if (!categories.length && throwIfNotFound)
    throw new EPP({
      code: "NOT_FOUND",
      message: `No category found with the name: "${name}"`,
    });

  return categories;
}
