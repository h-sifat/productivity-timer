import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";

import type {
  TimeInfo,
  TimerInstance,
  TimerMethodCallResult,
} from "src/countdown-timer/type";
import { Speaker } from "src/speaker";
import type { Controller } from "../interface";
import type { TimerRefWithName } from "./interface";
import { TimerStateNames } from "src/countdown-timer/timer";

export interface TimerCommandResponsePayload {
  message: string;
  state: TimerStateNames;
  ref: TimerRefWithName | null;
  timeInfo: TimeInfo<TimerRefWithName>;
}

export interface makePostCommand_Argument {
  DEFAULT_TIMER_DURATION: number;
  speaker: Speaker;
  timer: Pick<
    TimerInstance<TimerRefWithName | null>,
    | "end"
    | "ref"
    | "info"
    | "pause"
    | "reset"
    | "start"
    | "state"
    | "timeInfo"
    | "duration"
    | "setDuration"
  >;
}

export type TimerCommandNames =
  | "end"
  | "info"
  | "pause"
  | "reset"
  | "start"
  | "timeInfo"
  | "setDuration";

export function makePostTimerCommand(
  factoryArg: makePostCommand_Argument
): Controller {
  const { DEFAULT_TIMER_DURATION } = factoryArg;

  const TimerRefSchema = z
    .object({
      id: z.string().trim().min(1),
      name: z.string().trim().min(1),
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
            duration: DurationSchema.optional(),
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
                ref: z.union([TimerRefSchema, z.literal(null)]),
                duration: DurationSchema.default(DEFAULT_TIMER_DURATION),
              })
              .strict(),
            z.literal(null),
          ])
          .default(null),
      })
      .strict(),
  ]);

  const { timer, speaker } = factoryArg;
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

      // If any command is issued while the speaker is beeping, then turn
      // off the beeping.
      if (speaker.isPlaying) speaker.pause();

      let result:
        | {
            isMethodCallResult: true;
            data: {
              state: TimerStateNames;
              ref?: TimerRefWithName | null;
              callResult: TimerMethodCallResult;
              timeInfo: TimeInfo<TimerRefWithName>;
            };
          }
        | { isMethodCallResult: false; data: any };
      switch (command.name) {
        case "end":
        case "pause":
          result = {
            isMethodCallResult: true,
            data: {
              // @WARNING put the callResult always at the top
              callResult: timer[command.name](),
              ref: timer.ref,
              state: timer.state,
              timeInfo: timer.timeInfo,
            },
          };
          break;

        case "info":
        case "timeInfo":
          result = { isMethodCallResult: false, data: timer[command.name] };
          break;

        case "start":
          {
            const { arg: commandArg } = command;
            if (!commandArg) {
              result = {
                isMethodCallResult: true,
                data: {
                  // @WARNING put the callResult always at the top
                  callResult: timer.start(),
                  ref: timer.ref,
                  state: timer.state,
                  timeInfo: timer.timeInfo,
                },
              };
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

            result = {
              isMethodCallResult: true,
              data: {
                // @WARNING put the callResult always at the top
                callResult: timer.start(),
                ref: timer.ref,
                state: timer.state,
                timeInfo: timer.timeInfo,
              },
            };
          }
          break;

        case "reset":
          {
            const { duration = timer.duration, hardReset } = command.arg;
            const resetArg = hardReset
              ? { duration, ref: null }
              : { duration, ref: timer.ref };

            const callResult = timer.reset(resetArg);

            result = {
              isMethodCallResult: true,
              data: {
                callResult,
                ref: timer.ref,
                state: timer.state,
                timeInfo: timer.timeInfo,
              },
            };
          }
          break;

        case "setDuration":
          result = {
            isMethodCallResult: true,
            data: {
              // @WARNING put the callResult always at the top
              callResult: timer.setDuration(command.arg.duration),
              ref: timer.ref,
              state: timer.state,
              timeInfo: timer.timeInfo,
            },
          };
          break;

        default: {
          const __exhaustiveCheck: never = command;
          throw new Error("Should not reach here!");
        }
      }

      if (result.isMethodCallResult) {
        const { callResult, ref = null, timeInfo, state } = result.data;
        const { success, message } = callResult;
        const payload: TimerCommandResponsePayload = {
          ref,
          state,
          message,
          timeInfo,
        };

        return success
          ? { body: { success: true, data: payload } }
          : { body: { success: false, error: payload } };
      }
      return { body: { success: true, data: result.data } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
