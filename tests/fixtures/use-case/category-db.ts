// @ts-nocheck
import type { CategoryFields } from "entities/category/category";
import type { QueryExecutorMethodArg } from "fixtures/data-access/mock-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { QueryMethodArguments } from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";
import MockDb from "fixtures/data-access/mock-db";

export default class CategoryDatabase
  extends MockDb<string, CategoryFields>
  implements CategoryDatabaseInterface
{
  async findAll() {
    return await this.find();
  }

  override async updateById(arg: { id; edited }): Promise<void> {
    const { id, edited } = arg;
    await super.updateById({ id, changes: edited });
  }

  async findParentCategories(arg: { id: string }): Promise<CategoryFields[]> {
    this.assertValidId(arg);

    return this.enqueueQuery<CategoryFields[]>({
      arg,
      method: "findParentCategories",
    });
  }

  protected __findParentCategories__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;
    const { id: childId } = arg;

    const category = this.__getDocument__(childId)!;

    const parentCategories = this.findParentCategoriesSync({
      parentId: category.parentId!,
    });

    return resolve(parentCategories);
  }

  protected findParentCategoriesSync(arg: {
    parentId: string;
  }): CategoryFields[] {
    const { parentId } = arg;

    let currentParent = this.__getDocument__(parentId)!;
    const allParents: CategoryFields[] = [currentParent];

    while (currentParent?.parentId) {
      currentParent = this.__getDocument__(currentParent.parentId)!;
      allParents.push(currentParent);
    }

    return allParents;
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
    arg: QueryMethodArguments["findSubCategories"]
  ): Promise<CategoryFields[]> {
    this.assertValidId({ id: arg.parentId });
    return this.enqueueQuery<CategoryFields[]>({
      arg,
      method: "findSubCategories",
    });
  }

  protected __findSubCategories__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;
    const subCategories = this.findChildrenSync({
      parentId: arg.parentId,
      recursive: arg.recursive || false,
      allDocuments: this.__getAllDocuments__(),
    });

    resolve(subCategories);
  }

  private findChildrenSync(arg: {
    parentId: string;
    recursive: boolean;
    allDocuments: CategoryFields[];
  }): CategoryFields[] {
    const { parentId, recursive, allDocuments } = arg;

    const subCategories: CategoryFields[] = [];

    for (const category of allDocuments) {
      if (category.parentId !== parentId) continue;

      subCategories.push(category);

      if (recursive)
        subCategories.push(
          ...this.findChildrenSync({
            parentId: category.id,
            recursive,
            allDocuments,
          })
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
