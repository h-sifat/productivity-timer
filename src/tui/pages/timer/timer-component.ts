import blessed from "blessed";
import contrib from "blessed-contrib";
import { formatDurationMsAsHMS } from "common/util/date-time";

import type { Debug, ElementPosition, Message } from "tui/interface";
import type { Widgets as BlessedWidgets } from "blessed";
import type { TimerEventLog } from "src/countdown-timer/timer";
import type { widget as BlessedContribWidget } from "blessed-contrib";
import { formatMessageForBlessedElement } from "tui/util";

export interface TimerComponent_Argument {
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
}

interface TimerInfo {
  id: string;
  name: string;
  type: string;
  state: string;
}

interface DurationInfo {
  targetMs: number;
  elapsedMs: number;
}

interface Clear_Argument {
  renderScreen: boolean;
  infos?: Partial<Record<"ref" | "events" | "duration" | "message", boolean>>;
}

type Update_Argument = Partial<{
  message: Message;
  refInfo: TimerInfo;
  event: TimerEventLog;
  durationInfo: DurationInfo;
}>;

const defaultInfo: TimerInfo = Object.freeze({
  id: "--",
  name: "--",
  type: "--",
  state: "--",
});
const defaultDonutLabel = "--:--:--/--:--:--";

export class TimerComponent {
  static readonly width = 46;
  static readonly height = 18;

  #donut: BlessedContribWidget.Donut;
  #wrapper: BlessedWidgets.BoxElement;
  #infoBox: BlessedWidgets.BoxElement;
  #eventsBox: BlessedWidgets.BoxElement;
  #messageBox: BlessedWidgets.BoxElement;

  #debug: Debug;
  #renderScreen: () => void;

  constructor(arg: TimerComponent_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { top, left, right, bottom } = arg.position || {};
      this.#wrapper = blessed.box({
        top,
        left,
        right,
        bottom,
        border: "line",
        width: TimerComponent.width,
        height: TimerComponent.height,
      });
    }

    this.#donut = contrib.donut({
      parent: this.#wrapper,

      radius: 10,
      arcWidth: 4,

      top: 0,
      left: "50%-23",

      width: 22,
      height: 10,
      align: "center",
      remainColor: "white",

      data: [
        {
          percent: "0",
          color: "green",
          label: defaultDonutLabel,
        },
      ],
    });

    this.#infoBox = blessed.box({
      parent: this.#wrapper,
      top: 1,
      height: 6,
      tags: true,
      left: "50%-3",
      scrollable: false,
      content: this.#formatInfoObject(defaultInfo),
    });

    this.#eventsBox = blessed.box({
      border: "line",
      // @ts-ignore
      label: { side: "right", text: "[Timer Events]" },

      parent: this.#wrapper,

      top: 7,
      left: "center",

      height: 6,
      width: 40,

      tags: true,
      align: "center",

      mouse: true,
      scrollable: true,

      style: { fg: "green" },
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    this.#messageBox = blessed.box({
      top: 14,
      height: 2,
      tags: true,
      mouse: true,
      width: "90%",
      left: "center",
      align: "center",
      scrollable: true,
      parent: this.#wrapper,
    });
  }

  #formatInfoObject(info: TimerInfo) {
    return Object.entries(info)
      .map(([k, v]) => `{green-fg}${k}:{/} ${v}`)
      .join("\n");
  }

  #formatEvent(event: TimerEventLog) {
    const { name, timestamp } = event;
    return `{green-fg}${name}{/}: ${new Date(timestamp).toLocaleString()}`;
  }

  #pushEvent(arg: { event: TimerEventLog; renderScreen: boolean }) {
    const { event, renderScreen = true } = arg;
    const formattedEvent = this.#formatEvent(event);

    this.#eventsBox.pushLine(formattedEvent);
    this.#eventsBox.setScrollPerc(100);

    if (renderScreen) this.#renderScreen();
  }

  pushEvent(event: TimerEventLog) {
    this.#pushEvent({ event, renderScreen: true });
  }

  #clearEvents(arg: { renderScreen: boolean }) {
    const { renderScreen = true } = arg;

    this.#eventsBox.setContent("");
    // sometimes the label moves down after clearing the contents.
    // this.#eventsBox.setLabel({ text: "[Timer Events]", side: "right" });

    if (renderScreen) this.#renderScreen();
  }

  clearEvents() {
    this.#clearEvents({ renderScreen: true });
  }

  #setRefInfo(arg: { info: TimerInfo; renderScreen: boolean }) {
    const { info, renderScreen = true } = arg;

    const formattedInfo = this.#formatInfoObject(info);
    this.#infoBox.setContent(formattedInfo);

    if (renderScreen) this.#renderScreen();
  }

  setRefInfo(info: TimerInfo) {
    this.#setRefInfo({ info, renderScreen: true });
  }

  #clearRefInfo(arg: { renderScreen: boolean }) {
    const { renderScreen = true } = arg;
    this.#setRefInfo({ info: defaultInfo, renderScreen });
  }

  clearRefInfo() {
    this.#clearRefInfo({ renderScreen: true });
  }

  #setDurationInfo(arg: {
    renderScreen: boolean;
    durationInfo: DurationInfo | null;
  }) {
    const { percent, label } = (() => {
      if (!arg.durationInfo) return { percent: "0", label: defaultDonutLabel };

      const { elapsedMs, targetMs } = arg.durationInfo;

      const percent = String(elapsedMs / targetMs);
      const donutLabel =
        formatDurationMsAsHMS({ duration: elapsedMs, separator: ":" }) +
        "/" +
        formatDurationMsAsHMS({ duration: targetMs, separator: ":" });

      return { percent, label: donutLabel };
    })();

    this.#donut.setData([{ percent, label, color: "green" }]);

    const { renderScreen = true } = arg;
    if (renderScreen) this.#renderScreen();
  }

  setDurationInfo(durationInfo: DurationInfo) {
    this.#setDurationInfo({ durationInfo, renderScreen: true });
  }

  clearDurationInfo() {
    this.#setDurationInfo({ durationInfo: null, renderScreen: true });
  }

  #clear(arg: Clear_Argument) {
    const {
      ref = true,
      events = true,
      message = true,
      duration = true,
    } = arg.infos || {};

    if (ref) this.#clearRefInfo({ renderScreen: false });
    if (events) this.#clearEvents({ renderScreen: false });
    if (message) this.#clearMessage({ renderScreen: false });
    if (duration)
      this.#setDurationInfo({ durationInfo: null, renderScreen: false });

    if (arg.renderScreen) this.#renderScreen();
  }

  clear(infos: Clear_Argument["infos"] = {}) {
    this.#clear({ infos, renderScreen: true });
  }

  #setMessage(arg: { message: Message; renderScreen: boolean }) {
    const { message, renderScreen } = arg;
    const formattedMessage = formatMessageForBlessedElement(message);

    this.#messageBox.setContent(formattedMessage);
    if (renderScreen) this.#renderScreen();
  }

  setMessage(message: Message) {
    this.#setMessage({ message, renderScreen: true });
  }

  #clearMessage(arg: { renderScreen: boolean }) {
    this.#messageBox.setContent("");
    if (arg.renderScreen) this.#renderScreen();
  }

  clearMessage() {
    this.#clearMessage({ renderScreen: true });
  }

  #update(arg: Update_Argument & { renderScreen: boolean }) {
    if (arg.durationInfo)
      this.#setDurationInfo({
        renderScreen: false,
        durationInfo: arg.durationInfo,
      });
    if (arg.event) this.#pushEvent({ event: arg.event, renderScreen: false });
    if (arg.refInfo)
      this.#setRefInfo({ info: arg.refInfo, renderScreen: false });
    if (arg.message)
      this.#setMessage({ message: arg.message, renderScreen: false });

    if (arg.renderScreen) this.#renderScreen();
  }

  update(arg: Update_Argument = {}) {
    this.#update({ ...arg, renderScreen: true });
  }

  get element() {
    return this.#wrapper;
  }
}
