import blessed from "blessed";
// @ts-ignore
import Context from "drawille-canvas";

import { drawClock } from "./util";
import { Page } from "tui/components/page";
import type { CanvasContext } from "./interface";
import type { Debug, TimerManagerInterface } from "tui/interface";

export interface createClockPage_Argument {
  debug: Debug;
  renderScreen(): void;
  timerManager: TimerManagerInterface;
}
export function createClockPage(arg: createClockPage_Argument) {
  const { debug, renderScreen } = arg;

  const clockBoxDimension = Object.freeze({
    width: 37,
    height: 19,
  });

  // ---------------- Components -----------------------------

  const message = "Today is a gift from the Almighty.";
  const wrapper = blessed.box({
    top: "center",
    left: "center",
    width: clockBoxDimension.width - 1,
    height: clockBoxDimension.height + 3,
  });

  const clockBox = blessed.box({
    parent: wrapper,
    ...clockBoxDimension,
    fg: "green",
  });

  const dateTimeBox = blessed.box({
    right: 2,
    height: 2,
    fg: "green",
    align: "center",
    parent: wrapper,
    top: clockBoxDimension.height - 2,
  });

  const page = new Page({
    debug,
    top: 1,
    renderScreen,
    children: [wrapper],
  });

  // ------------- Drawing the Clock ----------------------
  const clockBoxSideLength = 65;
  const ctx: CanvasContext = new Context(
    clockBoxSideLength,
    clockBoxSideLength
  );
  const clockRadius = 30;
  const clockCenterCoordinate = Object.freeze({
    x: clockBoxSideLength / 2,
    y: clockBoxSideLength / 2,
  });

  function update() {
    const date = new Date();
    const stringifiedClockCanvas = drawClock({
      ctx,
      date,
      radius: clockRadius,
      center: clockCenterCoordinate,
    });
    clockBox.setContent(stringifiedClockCanvas);

    dateTimeBox.setLine(
      0,
      `${date.toLocaleTimeString()} | ${date.toDateString()}`
    );
    dateTimeBox.setLine(1, message);

    renderScreen();
  }

  // ------------ Updating The Clock ---------------

  let clockUpdateIntervalId: any = undefined;

  {
    const { timerManager } = arg;

    page.element.on("show", () => {
      if (clockUpdateIntervalId !== undefined) return;

      update();
      clockUpdateIntervalId = timerManager.setInterval(update, 1000);
    });

    page.element.on("hide", () => {
      timerManager.clearInterval(clockUpdateIntervalId);
      clockUpdateIntervalId = undefined;
    });
  }

  return { page };
}
