import type { CategoryFields } from "entities/category/category";
import type { QueryExecutorMethodArg } from "fixtures/data-access/mock-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { FindChildren_Argument } from "use-cases/interfaces/category-db";

import { assert } from "handy-types";
import required from "common/util/required";
import MockDb from "fixtures/data-access/mock-db";
import EPP from "common/util/epp";

export default class CategoryDatabase
  extends MockDb<string, CategoryFields>
  implements CategoryDatabaseInterface
{
  async findAll() {
    return await this.find();
  }

  async findByHash(arg: { hash: string }): Promise<CategoryFields | null> {
    let { hash = required("hash") } = arg;

    assert<string>("non_empty_string", hash, {
      name: "hash",
      code: "INVALID_HASH",
    });

    return this.enqueueQuery<CategoryFields | null>({
      arg,
      method: "findByHash",
    });
  }

  protected __findByHash__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;

    for (const existingDocument of this.__getAllDocuments__())
      if (existingDocument.hash === arg.hash) return resolve(existingDocument);

    resolve(null);
  }

  async findSubCategories(
    arg: FindChildren_Argument
  ): Promise<CategoryFields[]> {
    this.assertValidId(arg);
    return this.enqueueQuery<CategoryFields[]>({
      arg,
      method: "findSubCategories",
    });
  }

  protected __findSubCategories__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;
    const subCategories = this.findChildrenSync({
      id: arg.id,
      recursive: arg.recursive || false,
    });

    resolve(subCategories);
  }

  private findChildrenSync(arg: {
    id: string;
    recursive: boolean;
  }): CategoryFields[] {
    const { id, recursive } = arg;

    const subCategories: CategoryFields[] = [];

    for (const subCategory of this.__getAllDocuments__()) {
      if (subCategory.parentId !== id) continue;

      subCategories.push(subCategory);

      if (recursive)
        subCategories.push(
          ...this.findChildrenSync({ id: subCategory.id, recursive })
        );
    }

    return subCategories;
  }

  // make the hash field unique
  protected override __setDocument__(arg: {
    id: string;
    callee: string;
    document: CategoryFields;
    reject: (v: unknown) => void;
  }) {
    const { id, callee, document: insertingDocument, reject } = arg;

    // for updateById and corruptById don't impose this restriction
    if (!["updateById", "corruptById"].includes(callee)) {
      for (const existingDocument of this.store.values())
        if (existingDocument.hash === insertingDocument.hash) {
          const error = new EPP({
            code: "DUPLICATE_HASH",
            message: `A document with hash: "${insertingDocument.hash}" already exists.`,
          });
          reject(error);
          return this.store;
        }
    }

    return this.store.set(id, insertingDocument);
  }
}
