import type { Command } from "commander";
import { addEndTimerCommand } from "./end";
import { addTimerInfoCommand } from "./info";
import { addPauseTimerCommand } from "./pause";
import { addResetTimerCommand } from "./reset";
import { addTimerStartCommand } from "./start";
import { addRestartTimerCommand } from "./restart";
import { addStartBreakTimerCommand } from "./break";
import { addSetTimerDurationCommand } from "./set-duration";

export function addTimerCommands(program: Command) {
  addEndTimerCommand(program);
  addTimerInfoCommand(program);
  addPauseTimerCommand(program);
  addResetTimerCommand(program);
  addTimerStartCommand(program);
  addRestartTimerCommand(program);
  addStartBreakTimerCommand(program);
  addSetTimerDurationCommand(program);
}
