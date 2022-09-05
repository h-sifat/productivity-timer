import { CategoryInterface } from "entities/category/category";

export default function categoryFixture(
  props: Partial<CategoryInterface> = {}
): CategoryInterface {
  const defaults: CategoryInterface = {
    id: "2",
    parentId: "1",
    name: "study",
    createdOn: 100,
    modifiedOn: 200,
    description: "Repeatedly banging my head on the desk :(",
  };

  return { ...defaults, ...props };
}
