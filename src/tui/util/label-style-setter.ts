import type { Widgets } from "blessed";
import type { BlessedElementStyle } from "tui/interface";

import { setElementsLabelStyle } from ".";

export interface setLabelStyleOnFocusAndBlur_Arg {
  renderScreen(): void;
  blurStyle?: BlessedElementStyle;
  element: Widgets.BlessedElement;
  focusStyle?: BlessedElementStyle;
}

export function setLabelStyleOnFocusAndBlur(
  arg: setLabelStyleOnFocusAndBlur_Arg
) {
  const {
    element,
    renderScreen,
    blurStyle = { fg: "white" },
    focusStyle = { fg: "green" },
  } = arg;

  element.on("focus", () => {
    setElementsLabelStyle({ style: focusStyle, element });
    renderScreen();
  });

  element.on("blur", () => {
    setElementsLabelStyle({ style: blurStyle, element });
    renderScreen();
  });
}
