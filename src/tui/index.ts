import {
  BROADCAST_CHANNELS,
  API_AND_SERVER_CONFIG as config,
} from "src/config/other";

import blessed from "blessed";
import { store } from "./store";
import EventEmitter from "events";
import { Page } from "./components/page";
import type { Client } from "express-ipc";
import { withClient } from "cli/util/client";
import { createTimerPage } from "./pages/timer";
import { NavigationBar } from "./components/navbar";
import ProjectService from "client/services/project";
import { TimerService } from "client/services/timer";
import { PromptComponent } from "./components/prompt";
import { createCategoryPage } from "./pages/category";
import { createProjectPage } from "./pages/project";
import CategoryService from "client/services/category";
import { createAlertElement } from "./components/alert";
import { loadProjects, selectProjects } from "./store/projectSlice";
import { SuggestionsProvider } from "./pages/timer/suggestions-provider";
import { loadCategories, selectCategories } from "./store/categorySlice";
import { makeGlobalKeypressHandler } from "./util/global-keypress-handler";

const screen = blessed.screen({
  debug: true,
  smartCSR: true,
  dockBorders: true,
  title: "Productivity Timer",
});

// --------------- Global Variables and Constants ------------------
const debug: (...args: any[]) => void = screen.debug.bind(screen);
const renderScreen = () => screen.render();

const prompt = new PromptComponent({ debug, renderScreen, zIndex: 1000 });
const { element: alertElement, alert } = createAlertElement();

const isAnInputElementFocused = () => screen?.focused instanceof blessed.input;

// ----------------- Connection to the backend ----------------------------
withClient(
  (client) =>
    new Promise((resolve) => {
      main({ client });

      // Control-C.
      screen.key(["C-c"], async function () {
        resolve(); // this will disconnect the client from the server
        screen.destroy();
        process.exitCode = 0;
      });
    })
);

// ----------------- Main Script ---------------------------------
async function main(arg: { client: Client }) {
  const { client } = arg;

  const categoryService = new CategoryService({
    client,
    url: config.API_CATEGORY_PATH,
  });

  const projectService = new ProjectService({
    client,
    url: config.API_PROJECT_PATH,
  });

  const suggestionsProvider = new SuggestionsProvider();

  await client.subscribe(Object.values(BROADCAST_CHANNELS));
  const timerEventsEmitter = new EventEmitter();
  const timerService = new TimerService({ url: config.API_TIMER_PATH, client });

  // --------------------- Handling server sent events -------------------
  client.on("broadcast", (arg) => {
    switch (arg.channel) {
      case BROADCAST_CHANNELS.TIMER_BROADCAST_CHANNEL:
        timerEventsEmitter.emit(arg.data.event, arg.data.arg);
        break;

      case BROADCAST_CHANNELS.CATEGORY_BROADCAST_CHANNEL:
        store.dispatch(loadCategories(categoryService));
        break;

      case BROADCAST_CHANNELS.PROJECT_BROADCAST_CHANNEL:
        store.dispatch(loadProjects(projectService));
        break;
    }
  });

  // ---------------- Managing State changes -------------------------
  function reloadProjectAndCategoryData() {
    const categories = selectCategories(store);
    const projects = selectProjects(store);

    suggestionsProvider.update({ project: projects, category: categories });
    Categories.loadCategories(categories);
    Projects.loadProjects(projects);
  }

  store.subscribe(() => {
    reloadProjectAndCategoryData();
  });

  // ------------------- Creating Components And Pages ---------------
  const { timerPage } = createTimerPage({
    debug,
    renderScreen,
    CountDownTimerService: timerService,
    timerEventsEmitter: timerEventsEmitter as any,
    getTimerFormSuggestions: suggestionsProvider.getSuggestions,
  });

  const Categories = createCategoryPage({
    alert,
    debug,
    renderScreen,
    categoryService,
    prompt: (message) => prompt.ask(message),
  });

  const Projects = createProjectPage({
    alert,
    debug,
    renderScreen,
    projectService,
    prompt: (message) => prompt.ask(message),
  });

  const pages: { [k: string]: Page } = Object.freeze({
    Timer: timerPage,
    Projects: Projects.page,
    Categories: Categories.page,
  });

  const navbar = new NavigationBar({
    debug,
    showTabSerialNumber: false,
    tabs: ["Timer", "Categories", "Projects"],
    style: { selected: { bg: "green", fg: "white" } },
  });

  // ------------- Appending Elements to the screen ---------------------
  screen.append(navbar.element);
  Object.values(pages).forEach((page) => screen.append(page.element));

  screen.append(prompt.element);
  screen.append(alertElement);

  // ------ Setting up global Keypress and Navigation Handling -------------
  const state = Object.seal({
    currentPage: pages[navbar.selected.name],
  });

  {
    const appKeyPressHandler = makeGlobalKeypressHandler({
      isAnInputElementFocused,
      focusNext() {
        state.currentPage.focusNext();
      },
      focusPrev() {
        state.currentPage.focusPrev();
      },
      nextTab() {
        navbar.move({ offset: 1 });
      },
      prevTab() {
        navbar.move({ offset: -1 });
      },
    });

    screen.on("keypress", appKeyPressHandler);
  }

  navbar.onChange = ({ name }) => {
    state.currentPage.hide();

    state.currentPage = pages[name];
    state.currentPage.show();

    renderScreen();
  };

  // --------- Rendering the screen and showing the first page --------------
  state.currentPage.show();
  renderScreen();

  // ---------- Loading Initial Application States ------------------------

  // loading initial timer states
  timerEventsEmitter.emit("tick", await timerService.getInfo());

  // loading initial states
  store.dispatch(loadCategories(categoryService));
  store.dispatch(loadProjects(projectService));
}
