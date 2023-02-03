import blessed, { Widgets } from "blessed";

export type Alert = (
  arg: string | { text: string; type: "error" | "log" }
) => void;

export function createAlertElement(): {
  element: Widgets.MessageElement;
  alert: Alert;
} {
  const alertBox = blessed.message({
    label: "[Alert]",

    width: 44,
    height: 8,

    right: 0,
    bottom: 0,

    mouse: true,
    align: "center",
    scrollable: true,

    focusable: false,

    tags: true,
    border: "line",
    style: { focus: { border: { fg: "green" } }, label: { fg: "green" } },
  });

  alertBox.hide();

  const alert: Alert = function _alert(arg) {
    const { text, type } =
      typeof arg === "string" ? ({ text: arg, type: "log" } as const) : arg;

    alertBox[type](text, () => {});
  };

  return { element: alertBox, alert };
}
