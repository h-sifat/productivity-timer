import { Option } from "commander";
import type { Command } from "commander";
import { printTables } from "cli/util/table";
import { withClient } from "cli/util/client";
import { preprocessProject } from "cli/util/project";
import { formatString, printObjectAsBox } from "cli/util";
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

type listProjects_Options = {
  json?: boolean;
} & ({ id?: string } | { name?: string });

const projectTableColumns = Object.freeze([
  "id",
  "name",
  "status",
  "deadline",
  "createdAt",
  "description",
]);

export async function listProjects(options: listProjects_Options) {
  const query = makeQueryFromOptions(options);

  await withClient(async (client) => {
    const { body } = (await client.get(config.API_PROJECT_PATH, {
      query,
    })) as any;

    if (!body.success) throw body.error;

    if ("json" in options) console.log(JSON.stringify(body.data));
    else if (Array.isArray(body.data)) {
      const projects = body.data;
      if (!projects.length)
        console.log(
          formatString({ string: `No project found.`, color: "red" })
        );
      else
        printTables({
          columns: projectTableColumns as string[],
          objects: formatProjectsForTable({ projects: body.data }),
        });
    } else if (!body.data)
      console.log(formatString({ string: "Not found.", color: "red" }));
    else printObjectAsBox({ object: preprocessProject(body.data) });
  });
}

function makeQueryFromOptions(options: listProjects_Options): Query {
  if ("id" in options) return { lookup: "byId", id: options.id };
  else if ("name" in options) return { lookup: "byName", name: options.name };
  else return { lookup: "all" };
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
      project = preprocessProject(project);

      // @ts-expect-error
      project.status = formatString({
        string: project.status,
        color: statusValueMap[project.status].color,
      });

      return project;
    });

  return projects;
}
