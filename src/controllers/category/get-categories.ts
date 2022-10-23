import { is } from "handy-types";
import EPP from "common/util/epp";

import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface MakeGetCategories_Argument {
  categoryService: Pick<
    CategoryServiceInterface,
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
   * get /categories/`:id?lookup=self` | getCategoryById
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

      if (!is<string>("non_empty_string", lookup))
        return {
          body: {},
          error: {
            code: "INVALID_QUERY_TYPE",
            message: `The "lookup" property in query string must be of type Non-Empty String.`,
          },
        };

      switch (lookup) {
        case "self":
          result = await categoryService.getCategoryById({ id });
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
