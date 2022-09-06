import { ProjectCategoryInterface } from "entities/project/project-category";

export default function projectCategoryFixture(
  override: Partial<ProjectCategoryInterface> = {}
): ProjectCategoryInterface {
  const defaults: ProjectCategoryInterface = Object.freeze({
    id: "100",
    fullName: "study/programming",
  });

  return { ...defaults, ...override };
}
