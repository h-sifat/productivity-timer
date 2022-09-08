import { CategoryFields } from "entities/category/category";

export default interface CategoryDatabase {
  findById(arg: { id: string }): Promise<CategoryFields | null>;
  findByHash(arg: { hash: string }): Promise<CategoryFields | null>;
  insert(arg: { categoryInfo: CategoryFields }): Promise<CategoryFields>;
}
