import { printTables } from "./table";
import { formatDateProperties } from "cli/util";
import type { CategoryFields } from "entities/category/category";

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
