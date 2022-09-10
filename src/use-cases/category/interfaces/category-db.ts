import { CategoryFields } from "entities/category/category";

export interface FindChildren_Argument {
  id: string;
  recursive?: boolean;
}

export default interface CategoryDatabase {
  findAll(): Promise<CategoryFields[]>;
  findById(arg: { id: string }): Promise<CategoryFields | null>;
  findByHash(arg: { hash: string }): Promise<CategoryFields | null>;
  findChildren(arg: FindChildren_Argument): Promise<CategoryFields[]>;
  removeCategories(arg: { ids: string[] }): Promise<CategoryFields[]>;
  insert(arg: { categoryInfo: CategoryFields }): Promise<CategoryFields>;
}
