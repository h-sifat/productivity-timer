import type {
  CategoryClass,
  CategoryFields,
  CategoryInterface,
} from "entities/category/category";

export interface MakeCategoryIfNotCorrupted_Argument {
  categoryRecord: CategoryFields;
  CategoryClass: CategoryClass;
}

export type MakeCategoryIfNotCorrupted = (
  arg: MakeCategoryIfNotCorrupted_Argument
) => CategoryInterface;
