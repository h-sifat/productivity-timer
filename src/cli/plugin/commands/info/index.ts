import { pick } from "common/util/other";
import { Command, Option } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import type { TimerInfo } from "src/countdown-timer/type";
import { formatClockDuration } from "tui/pages/timer/util";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { ParsedTemplate, parseInfoTemplate } from "./template-parser";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export function addInfoCommand(program: Command) {
  program
    .command("info")
    .description("Shows the timer information.")
    .addOption(
      new Option(
        "-t, --template <info-template>",
        `Example: "[ref] - [ed] / [td] | [state]". Please see the Github README for detailed explanation.`
      ).conflicts("json")
    )
    .addOption(
      new Option("-j, --json", "print raw json data.").conflicts("template")
    )

    .addOption(
      new Option("--verbose", "show verbose error message.")
        .conflicts("json")
        .default(false)
    )
    .action(showInfo);
}

type showInfo_Options =
  | { template: string; verbose: boolean }
  | { json: boolean };

export async function showInfo(options: showInfo_Options) {
  if (!("json" in options) && !("template" in options)) {
    console.log(
      (<any>options).verbose
        ? "Please provide the --template or --json option."
        : "options required"
    );
    return;
  }

  let parsedTemplate: ParsedTemplate;

  if ("template" in options)
    try {
      parsedTemplate = parseInfoTemplate(options.template);
    } catch (ex) {
      console.log(options.verbose ? ex.message : "invalid template");
      return;
    }

  await withClient(
    async (client) => {
      let info: TimerInfo<TimerRefWithName>;

      try {
        const timerService = new TimerService({
          client,
          url: config.API_TIMER_PATH,
        });

        info = await timerService.getInfo();

        if ("json" in options)
          return console.log(JSON.stringify({ error: null, data: info }));
      } catch (ex) {
        if ("json" in options)
          return console.log(
            JSON.stringify({ data: null, error: pick(ex, ["message", "code"]) })
          );

        console.log(options.verbose ? ex.message : "fetch error");
        return;
      }

      try {
        let nameAndDurationPairs: [string, string][] = [
          ["td", info.duration],
          ["rd", info.remainingTime],
          ["ed", info.elapsedTime.total],
        ].map(([name, duration]) => [
          name,
          formatClockDuration(<number>duration),
        ]) as any;

        // removing the "00:" from the start
        if (
          nameAndDurationPairs.every(([_, duration]) =>
            duration.startsWith("00:")
          )
        )
          nameAndDurationPairs = nameAndDurationPairs.map(
            ([name, duration]) => [name, duration.slice(3)]
          );

        const durations = nameAndDurationPairs.reduce(
          (obj, [name, duration]) => {
            (<any>obj)[name] = duration;
            return obj;
          },
          {} as Pick<interpolateTemplate_Argument["values"], "td" | "rd" | "ed">
        );

        const infoString = interpolateTemplate({
          parsedTemplate,
          values: {
            ...durations,
            state: info.state,
            ref: info.ref ? getRefLabel(info.ref) : "Break",
          },
        });

        console.log(infoString);
      } catch (ex) {
        console.log(ex.message);
      }
    },
    {
      onNotRunning: () => {
        if ("json" in options)
          return console.log(
            JSON.stringify({
              data: null,
              error: { message: "Server not reachable", code: "SERVER_DOWN" },
            })
          );

        console.log("server down");
      },
    }
  );
}

interface interpolateTemplate_Argument {
  values: {
    ed: string;
    rd: string;
    td: string;
    ref: string;
    state: string;
    [k: string]: any;
  };
  parsedTemplate: ParsedTemplate;
}

function interpolateTemplate(arg: interpolateTemplate_Argument) {
  const { values } = arg;
  const { variables } = arg.parsedTemplate;
  const segments = [...arg.parsedTemplate.segments];

  for (const { name, index } of variables)
    if (name in values) segments[index] = values[name];
    else throw new Error(`unknown var "${name}".`);

  return segments.join("");
}

function getRefLabel(ref: TimerRefWithName) {
  return `${ref.type[0]}(${ref.id})/${ref.name.slice(0, 15)}`;
}
