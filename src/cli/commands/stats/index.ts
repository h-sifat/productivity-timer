// @ts-expect-error no type definition
import Pie from "cli-pie";

import { sub } from "date-fns";
import { assert } from "handy-types";
import { formatString } from "cli/util";
import type { Command } from "commander";
import type { Writable } from "type-fest";
import { printTables } from "cli/util/table";
import { withClient } from "cli/util/client";
import { formatDuration } from "cli/util/timer";
import { getPieRadius } from "cli/util/console";
import ProjectService from "client/services/project";
import CategoryService from "client/services/category";
import { toLocaleDateString } from "common/util/date-time";
import WorkSessionService from "client/services/work-session";
import type { ProjectFields } from "entities/project/project";
import type { CategoryFields } from "entities/category/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { WorkSessionFields } from "entities/work-session/work-session";
import type { TimerRefWithName } from "src/controllers/timer/interface";

type ModifiedWorkSession = Omit<WorkSessionFields, "ref"> & {
  ref: Required<TimerRefWithName>;
};

export function addStatCommand(program: Command) {
  program
    .command("stats")
    .description("Shows statistics and work history.")
    .option(
      "-d, --date <mm-dd-yyyy-or-number>",
      "show the stats of a specific date or <number> days before the today."
    )
    .option("--json", "print raw JSON.")
    .action(showStats);
}

interface showStats_Options {
  date?: string;
  json?: boolean;
}

async function showStats(options: showStats_Options) {
  await withClient(async (client) => {
    const statsDate = getStatsDate(options);

    console.log(
      `Stats of: ${formatString({
        string: statsDate.toDateString(),
        color: "green",
      })}`
    );

    const workSessionService = new WorkSessionService({
      client,
      url: config.API_WORK_SESSION_PATH,
    });
    const categoryService = new CategoryService({
      client,
      url: config.API_CATEGORY_PATH,
    });
    const projectService = new ProjectService({
      client,
      url: config.API_PROJECT_PATH,
    });

    const categories = await categoryService.findAll();
    const projects = await projectService.findAll();

    const categoryIndex: { [id: string]: Writable<CategoryFields> } =
      categories.reduce((categoryIndex: any, category) => {
        categoryIndex[category.id] = category;
        return categoryIndex;
      }, {});

    const projectIndex: { [id: string]: Writable<ProjectFields> } =
      projects.reduce((projectIndex: any, project) => {
        projectIndex[project.id] = project;
        return projectIndex;
      }, {});

    const indexes = {
      project: projectIndex,
      category: categoryIndex,
    } as const;

    const todaysWorkSessions: ModifiedWorkSession[] = (
      await workSessionService.getWorkSessions({
        to: toLocaleDateString(statsDate),
        from: toLocaleDateString(statsDate),
      })
    ).map((workSession) => {
      const { id, type } = workSession.ref;
      // @ts-ignore
      workSession.ref.name = indexes[type][id].name;
      return workSession as ModifiedWorkSession;
    });

    if (options.json) console.log(JSON.stringify(todaysWorkSessions));
    else printDailyStats(todaysWorkSessions);
  });
}

type PieItem = { label: string; value: number };

function printDailyStats(workSessions: ModifiedWorkSession[]) {
  const pieItems: { [k: string]: PieItem } = {};
  let totalWorkTimeMs = 0;

  workSessions.forEach(({ elapsedTime, ref }) => {
    const key = `${ref.type[0]}(${ref.id})`;

    if (key in pieItems) pieItems[key].value += elapsedTime.total;
    else
      pieItems[key] = { label: `${key}/${ref.name}`, value: elapsedTime.total };

    totalWorkTimeMs += elapsedTime.total;
  });

  if (workSessions.length) {
    console.log();
    const pie = new Pie(getPieRadius(), Object.values(pieItems), {
      legend: true,
    });
    console.log(pie.toString());
  }

  console.log(
    `Total work time: ${formatString({
      color: "green",
      string: formatDuration(totalWorkTimeMs),
    })}`
  );

  if (workSessions.length)
    printTables({
      columns: ["name", "duration"],
      objects: Object.values(pieItems).map(
        ({ label: name, value: durationMs }) => ({
          name,
          duration: formatString({
            color: "green",
            string: formatDuration(durationMs),
          }),
        })
      ),
    });
}

function getStatsDate(options: showStats_Options) {
  if (!options.date) return new Date();

  const { date: dateStr } = options;

  if (/^\d+$/.test(dateStr)) {
    const daysToSubtractFromToday = Number(dateStr);
    assert<number>("positive_integer", daysToSubtractFromToday, {
      name: "date",
    });

    return sub(new Date(), { days: daysToSubtractFromToday });
  }

  const date = new Date(dateStr);
  if (Number.isNaN(+date)) throw new Error(`Invalid date string: "${dateStr}"`);
  return date;
}
