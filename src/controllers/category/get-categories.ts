import EPP from "common/util/epp";
import { assert, is } from "handy-types";

import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface MakeGetCategories_Argument {
  categoryService: Pick<
    CategoryServiceInterface,
    | "findByName"
    | "listCategories"
    | "getCategoryById"
    | "listSubCategories"
    | "listParentCategories"
  >;
}

export default function makeGetCategories(
  builderArg: MakeGetCategories_Argument
): Controller {
  const { categoryService } = builderArg;

  /**
   * RequestURL | Method to use
   * ---------- | ------
   * get /categories | listCategories
   * get /categories/`:id?lookup=self-by-id` | getCategoryById
   * get /categories/`:id?lookup=self-by-name` | findByName
   * get /categories/`:id?lookup=children` | listSubCategories
   * get /categories/`:id?lookup=parents` | listParentCategories
   * Anything else | Error
   * */
  return async function getCategories(request) {
    try {
      let result: any;

      if (!("id" in request.params))
        return { error: null, body: await categoryService.listCategories() };

      const id: any = request.params.id;
      const lookup = request.query.lookup;

      assert<string>("non_empty_string", lookup, {
        name: "Query.lookup",
        code: "INVALID_QUERY_TYPE",
      });

      switch (lookup) {
        case "self-by-id":
          result = await categoryService.getCategoryById({ id });
          break;
        case "self-by-name":
          result = await categoryService.findByName({ name: id });
          break;
        case "parents":
          result = await categoryService.listParentCategories({ id });
          break;
        case "children":
          result = await categoryService.listSubCategories({ parentId: id });
          break;
        default:
          throw new EPP({
            code: "INVALID_QUERY_TYPE",
            message: `Invalid "lookup" in query string: "${lookup}"`,
          });
      }

      return { error: null, body: result };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}
