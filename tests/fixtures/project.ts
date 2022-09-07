import { ProjectConstructorArgument } from "entities/project/project";

export default function projectFixture(
  override: Partial<ProjectConstructorArgument> = {}
): Required<ProjectConstructorArgument> {
  const defaults: Required<ProjectConstructorArgument> = Object.freeze({
    id: "100",
    status: "ongoing",
    createdOn: 1662464603531,
    modifiedOn: 1662464603531,
    name: "Make Productivity Timer App",
    deadline: new Date("09-12-2022").valueOf(), // Sep 12 2022, InshaAllah
    category: { id: "123", fullName: "programming/personal-project" },
    description:
      "A pomodoro timer app that you can control entirely with your keyboard.",
  });

  return { ...defaults, ...override };
}
