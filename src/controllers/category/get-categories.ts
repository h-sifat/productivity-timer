import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";
import { z } from "zod";
import { formatError } from "common/validator/zod";

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

const QuerySchema = z.discriminatedUnion("lookup", [
  z.object({ lookup: z.literal("all") }).strict(),
  z.object({ lookup: z.literal("parents"), id: z.string().min(1) }).strict(),
  z.object({ lookup: z.literal("children"), id: z.string().min(1) }).strict(),
  z.object({ lookup: z.literal("selfById"), id: z.string().min(1) }).strict(),
  z
    .object({ lookup: z.literal("selfByName"), name: z.string().min(1) })
    .strict(),
]);

export type QuerySchemaInterface = z.infer<typeof QuerySchema>;

export default function makeGetCategories(
  builderArg: MakeGetCategories_Argument
): Controller {
  const { categoryService } = builderArg;

  /**
   * RequestURL | Method to use
   * ---------- | ------
   * get /categories/`?lookup=all` | listCategories
   * get /categories/`?id=<id>&lookup=self-by-id` | getCategoryById
   * get /categories/`?name=<name>&lookup=self-by-name` | findByName
   * get /categories/`?id=<id>&lookup=children` | listSubCategories
   * get /categories/`?id=<id>&lookup=parents` | listParentCategories
   * Anything else | Error
   * */
  return async function getCategories(request) {
    try {
      const validationResult = QuerySchema.safeParse(request.query);

      if (!validationResult.success)
        throw {
          message: formatError(validationResult.error),
          code: "INVALID_QUERY",
        };

      const query = validationResult.data;

      let result: any;

      switch (query.lookup) {
        case "all":
          result = await categoryService.listCategories();
          break;
        case "selfById":
          result = await categoryService.getCategoryById({ id: query.id });
          break;
        case "selfByName":
          result = await categoryService.findByName({ name: query.name });
          break;
        case "parents":
          result = await categoryService.listParentCategories({ id: query.id });
          break;
        case "children":
          result = await categoryService.listSubCategories({
            parentId: query.id,
          });
          break;
        default:
          const __exhaustiveCheck: never = query;
      }

      return { body: { success: true, data: result as any } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
