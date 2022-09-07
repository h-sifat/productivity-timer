import { ProjectCategoryFields } from "entities/project/project-category";

export default function projectCategoryFixture(
  override: Partial<ProjectCategoryFields> = {}
): ProjectCategoryFields {
  const defaults: ProjectCategoryFields = Object.freeze({
    id: "100",
    fullName: "study/programming",
  });

  return { ...defaults, ...override };
}
