import {
  formatStr,
  getClient,
  printObjectAsBox,
  formatDateProperties,
  printErrorAndSetExitCode,
} from "../util";
import { Command, Option } from "commander";
import { printTables } from "../util/table";
import { ProjectFields } from "entities/project/project";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addProjectListCommand(ListCommand: Command) {
  ListCommand.command("projects")
    .description("Lists all the projects")
    .addOption(
      new Option("-i, --id <string>", "find project by id").conflicts("name")
    )
    .addOption(
      new Option("-n, --name <string>", "find project by name").conflicts("id")
    )
    .option("--json", "print raw JSON.")
    .action(listProjects);
}

type Query =
  | { lookup: "all" }
  | { lookup: "byId"; id: string }
  | { lookup: "byName"; name: string };

type listProjects_Argument = {
  json?: boolean;
} & ({ id?: string } | { name?: string });
export async function listProjects(options: listProjects_Argument) {
  let query: Query;
  if ("id" in options) query = { lookup: "byId", id: options.id };
  else if ("name" in options) query = { lookup: "byName", name: options.name };
  else query = { lookup: "all" };

  const client = await getClient();

  try {
    const response = await client.get(config.API_PROJECT_PATH, { query });
    const body: any = response.body;

    if (!body.success) {
      printErrorAndSetExitCode(body.error);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(body.data));
      return;
    }

    if (Array.isArray(body.data)) {
      printTables({
        columns: [
          "id",
          "name",
          "status",
          "deadline",
          "createdAt",
          "description",
        ],
        objects: formatProjectsForTable({ projects: body.data }),
      });
      return;
    }

    if (!body.data) {
      console.log(formatStr({ string: "Not found.", color: "red" }));
      return;
    }

    const project = formatDateProperties<ProjectFields>({
      object: body.data,
      dateProperties: ["createdAt", "deadline"],
    });
    printObjectAsBox({ object: project });
  } catch (ex) {
    printErrorAndSetExitCode(ex);
  } finally {
    client.close();
  }
}

function formatProjectsForTable(arg: { projects: ProjectFields[] }) {
  const statusValueMap = {
    ongoing: { value: 1, color: "yellow" },
    halted: { value: 2, color: "grey" },
    completed: { value: 3, color: "green" },
  } as const;

  const projects = arg.projects
    .sort(
      (a, b) => statusValueMap[a.status].value - statusValueMap[b.status].value
    )
    .map((project) => {
      project = formatDateProperties({
        type: "date",
        object: project,
        dateProperties: ["createdAt", "deadline"],
      });

      // @ts-expect-error
      project.status = formatStr({
        string: project.status,
        color: statusValueMap[project.status].color,
      });

      return project;
    });

  return projects;
}
