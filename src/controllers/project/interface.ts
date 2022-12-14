import { Controller } from "../interface";

export interface ProjectControllerInterface {
  get: Controller;
  post: Controller;
  patch: Controller;
  delete: Controller;
}
