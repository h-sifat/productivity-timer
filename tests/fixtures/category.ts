import { CategoryConstructor_Argument } from "entities/category/category";

export default function categoryFixture(
  props: Partial<CategoryConstructor_Argument> = {}
): Required<CategoryConstructor_Argument> {
  const defaults: Required<CategoryConstructor_Argument> = {
    id: "2",
    parentId: "1",
    name: "study",
    createdOn: 100,
    modifiedOn: 200,
    description: "Repeatedly banging my head on the desk :(",
  };

  return { ...defaults, ...props };
}
