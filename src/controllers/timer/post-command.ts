import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";

import type { Controller } from "../interface";
import type {
  TimerInstance,
  TimerMethodCallResult,
} from "src/countdown-timer/type";
import type { TimerRef } from "entities/work-session/work-session";

export interface makePostCommand_Argument {
  DEFAULT_TIMER_DURATION: number;
  timer: Pick<
    TimerInstance<TimerRef | null>,
    | "end"
    | "ref"
    | "info"
    | "pause"
    | "reset"
    | "start"
    | "state"
    | "timeInfo"
    | "setDuration"
  >;
}

export function makePostTimerCommand(
  factoryArg: makePostCommand_Argument
): Controller {
  const { DEFAULT_TIMER_DURATION } = factoryArg;

  const TimerRefSchema = z
    .object({
      id: z.string().trim().min(1),
      type: z.union([z.literal("category"), z.literal("project")]),
    })
    .strict();

  const DurationSchema = z.number().nonnegative().int();
  const CommandSchema = z.discriminatedUnion("name", [
    z.object({ name: z.literal("end") }).strict(),
    z.object({ name: z.literal("pause") }).strict(),
    z.object({ name: z.literal("info") }).strict(),
    z.object({ name: z.literal("timeInfo") }).strict(),
    z
      .object({
        name: z.literal("reset"),
        arg: z
          .object({
            duration: DurationSchema.default(DEFAULT_TIMER_DURATION),
            hardReset: z.boolean().default(false),
          })
          .strict()
          .default({}),
      })
      .strict(),

    z
      .object({
        name: z.literal("setDuration"),
        arg: z.object({ duration: DurationSchema }).strict(),
      })
      .strict(),

    z
      .object({
        name: z.literal("start"),
        arg: z
          .union([
            z
              .object({
                duration: DurationSchema.default(DEFAULT_TIMER_DURATION),
                ref: z.union([TimerRefSchema, z.literal(null)]),
              })
              .strict(),
            z.literal(null),
          ])
          .default(null),
      })
      .strict(),
  ]);

  const { timer } = factoryArg;
  return async function postTimerCommand(request) {
    try {
      let command: z.infer<typeof CommandSchema>;

      {
        const result = CommandSchema.safeParse(request.body);
        if (!result.success)
          throw new EPP({
            code: "INVALID_COMMAND",
            message: formatError(result.error),
          });

        command = result.data;
      }

      let result:
        | { isMethodCallResult: true; data: TimerMethodCallResult }
        | { isMethodCallResult: false; data: any };
      switch (command.name) {
        case "end":
        case "pause":
          result = { isMethodCallResult: true, data: timer[command.name]() };
          break;

        case "info":
        case "timeInfo":
          result = { isMethodCallResult: false, data: timer[command.name] };
          break;

        case "start":
          {
            const { arg: commandArg } = command;
            if (!commandArg) {
              result = { isMethodCallResult: true, data: timer.start() };
              break;
            }

            if (["RUNNING", "PAUSED"].includes(timer.state)) {
              throw {
                code: "COMMAND_FAILED",
                message: `A timer is already active. Please end or reset it first.`,
              };
            }

            {
              const resetResult = timer.reset(commandArg);
              if (!resetResult.success)
                throw { code: "COMMAND_FAILED", message: resetResult.message };
            }

            result = { isMethodCallResult: true, data: timer.start() };
          }
          break;

        case "reset":
          {
            const { duration, hardReset } = command.arg;
            const resetArg = hardReset
              ? { duration, ref: null }
              : { duration, ref: timer.ref };

            result = { isMethodCallResult: true, data: timer.reset(resetArg) };
          }
          break;

        case "setDuration":
          result = {
            isMethodCallResult: true,
            data: timer.setDuration(command.arg.duration),
          };
          break;

        default: {
          const __exhaustiveCheck: never = command;
          throw new Error("Should not reach here!");
        }
      }

      if (result.isMethodCallResult) {
        const { success, message } = result.data;
        return success
          ? { body: { success: true, data: { message } } }
          : { body: { success: false, error: { message } } };
      }
      return { body: { success: true, data: result.data } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
