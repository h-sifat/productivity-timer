// @ts-expect-error no type definition
import Pie from "cli-pie";
import { formatString } from "cli/util";
import type { Command } from "commander";
import type { Writable } from "type-fest";
import { printTables } from "cli/util/table";
import { withClient } from "cli/util/client";
import { formatDuration } from "cli/util/timer";
import { getPieRadius } from "cli/util/console";
import ProjectService from "client/services/project";
import CategoryService from "client/services/category";
import WorkSessionService from "client/services/work-session";
import type { ProjectFields } from "entities/project/project";
import type { CategoryFields } from "entities/category/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { WorkSessionFields } from "entities/work-session/work-session";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import {
  toLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { assert } from "handy-types";
import { sub } from "date-fns";

type ModifiedWorkSession = Omit<WorkSessionFields, "ref"> & {
  ref: Required<TimerRefWithName>;
};

export function addStatCommand(program: Command) {
  program
    .command("stats")
    .description("Shows statistics and work history.")
    .option(
      "-d, --date <date-string-or-number>",
      "show the stats of a specific date or <number> days before the today."
    )
    .action(showStats);
}

interface showStats_Options {
  date?: string;
}

async function showStats(options: showStats_Options) {
  await withClient(async (client) => {
    const statsDate = getStatsDate(options);

    console.log(
      `Stats of: ${formatString({
        string: statsDate.toDateString(),
        color: "green",
      })}\n`
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
        from: toLocaleDateString(statsDate),
      })
    ).map((workSession) => {
      const { id, type } = workSession.ref;
      // @ts-ignore
      workSession.ref.name = indexes[type][id].name;
      return workSession as ModifiedWorkSession;
    });

    printDailyStats(todaysWorkSessions);
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

  const pie = new Pie(getPieRadius(), Object.values(pieItems), {
    legend: true,
  });
  console.log(pie.toString());

  console.log(
    `Total work time: ${formatString({
      color: "green",
      string: formatDuration(totalWorkTimeMs),
    })}`
  );

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
    assert<number>("non_negative_integer", daysToSubtractFromToday, {
      name: "date",
    });

    return sub(new Date(), { days: daysToSubtractFromToday });
  }

  const date = new Date(dateStr);
  if (Number.isNaN(+date)) throw new Error(`Invalid date string: "${dateStr}"`);
  return date;
}
