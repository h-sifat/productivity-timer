import {
  CategoryFields,
  MakeCategory_Argument,
} from "entities/category/category";
import type { Client } from "express-ipc";
import type { Writable } from "type-fest";
import { EditCategory_Argument } from "use-cases/interfaces/category-service";

type CategoryInterface = Writable<CategoryFields>;

export type GetAllCategoriesQuery = { lookup: "all" };
export type GetCategoryByIdQuery = { lookup: "selfById"; id: string };
export type GetParentCategoriesQuery = { lookup: "parents"; id: string };
export type GetCategoryByNameQuery = { lookup: "selfByName"; name: string };
export type GetChildrenCategoriesQuery = { lookup: "children"; id: string };

export type GetCategoryQuery =
  | GetCategoryByIdQuery
  | GetParentCategoriesQuery
  | GetAllCategoriesQuery
  | GetCategoryByNameQuery
  | GetChildrenCategoriesQuery;

export interface CategoryService_Argument {
  url: string;
  client: Client;
}

export default class CategoryService {
  #client: Client;
  readonly #url: string;

  constructor(arg: CategoryService_Argument) {
    this.#client = arg.client;
    this.#url = arg.url;
  }

  async findAll(): Promise<CategoryInterface[]> {
    return this.get({ lookup: "all" });
  }
  async findById(arg: { id: string }): Promise<CategoryInterface | null> {
    return this.get({ lookup: "selfById", id: arg.id });
  }
  async findByName(arg: { name: string }): Promise<CategoryInterface[]> {
    return this.get({ lookup: "selfByName", name: arg.name });
  }
  async findParents(arg: { id: string }): Promise<CategoryInterface[]> {
    return this.get({ lookup: "parents", id: arg.id });
  }
  async findChildren(arg: { id: string }): Promise<CategoryInterface[]> {
    return this.get({ lookup: "children", id: arg.id });
  }

  async add(category: MakeCategory_Argument): Promise<CategoryInterface> {
    const { body } = (await this.#client.request({
      body: category,
      method: "post",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async edit(arg: EditCategory_Argument): Promise<CategoryInterface> {
    const { id, changes } = arg;
    const { body } = (await this.#client.request({
      url: this.#url,
      method: "patch",
      query: { id },
      body: { changes },
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async delete(arg: { id: string }): Promise<CategoryInterface[]> {
    const { body } = (await this.#client.request({
      url: this.#url,
      method: "delete",
      query: { id: arg.id },
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async get(query: GetCategoryQuery) {
    const { body } = (await this.#client.request({
      query,
      method: "get",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  set client(client: Client) {
    this.#client = client;
  }
}
