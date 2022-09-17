import { CategoryFields } from "entities/category/category";
import { ProjectFields } from "entities/project/project";

export interface FindChildren_Argument {
  parentId: string;
  recursive?: boolean;
}

export default interface CategoryDatabaseInterface {
  updateById(arg: {
    id: string;
    changes: Partial<ProjectFields>;
  }): Promise<CategoryFields>;
  findAll(): Promise<CategoryFields[]>;
  insert(arg: CategoryFields): Promise<CategoryFields>;
  deleteMany(arg: { ids: string[] }): Promise<CategoryFields[]>;
  findById(arg: { id: string }): Promise<CategoryFields | null>;
  findByHash(arg: { hash: string }): Promise<CategoryFields | null>;
  findSubCategories(arg: FindChildren_Argument): Promise<CategoryFields[]>;
  findParentCategories(arg: { id: string }): Promise<CategoryFields[]>;
}
