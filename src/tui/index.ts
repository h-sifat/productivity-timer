import blessed from "blessed";

const screen = blessed.screen({
  debug: true,
  smartCSR: true,
  title: "Productivity Timer",
});

// Control-C.
screen.key(["C-c"], function () {
  return process.exit(0);
});

const debug: (...args: any[]) => void = screen.debug.bind(screen);
const renderScreen = () => screen.render();

const box = blessed.box({
  border: "line",
  content: "Hello World",
});

screen.append(box);
renderScreen();
