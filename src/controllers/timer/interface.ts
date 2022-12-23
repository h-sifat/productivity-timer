import type { Controller } from "../interface";
import type { TimerRef } from "entities/work-session/work-session";

export interface TimerControllerInterface {
  post: Controller;
}

export type TimerRefWithName = TimerRef & { name?: string | undefined };
