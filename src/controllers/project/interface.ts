import { Controller } from "../interface";

export interface ProjectControllerInterface {
  postProject: Controller;
  patchProject: Controller;
  getCategories: Controller;
  deleteProject: Controller;
}
