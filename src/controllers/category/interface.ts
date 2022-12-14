import { Controller } from "../interface";

export interface CategoryControllerInterface {
  get: Controller;
  post: Controller;
  patch: Controller;
  delete: Controller;
}
