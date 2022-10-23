import { Controller } from "../interface";

export interface CategoryControllerInterface {
  postCategory: Controller;
  patchCategory: Controller;
  getCategories: Controller;
  deleteCategory: Controller;
}
