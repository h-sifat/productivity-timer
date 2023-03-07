import { Page } from "tui/components/page";
import { Markdown } from "tui/components/markdown";

// @ts-ignore
import helpMarkdown from "./help.md";

import type { Debug } from "tui/interface";

export interface createHelpPage_Argument {
  debug: Debug;
  renderScreen(): void;
}

export function createHelpPage(arg: createHelpPage_Argument) {
  const { debug, renderScreen } = arg;

  const markdown = new Markdown({
    debug,
    renderScreen,
    border: true,
  });

  markdown.setMarkdown(helpMarkdown);

  const page = new Page({
    debug,
    top: 1,
    renderScreen,
    children: [markdown.element],
  });

  return { page };
}
