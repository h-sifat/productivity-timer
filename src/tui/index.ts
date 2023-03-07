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
import TimerManager from "./util/timer-manager";
import { createClockPage } from "./pages/clock";
import { createStatsPage } from "./pages/stats";
import { createTimerPage } from "./pages/timer";
import { NavigationBar } from "./components/navbar";
import { createProjectPage } from "./pages/project";
import ProjectService from "client/services/project";
import { TimerService } from "client/services/timer";
import { PromptComponent } from "./components/prompt";
import { createCategoryPage } from "./pages/category";
import CategoryService from "client/services/category";
import MetaInfoService from "client/services/meta-info";
import { createAlertElement } from "./components/alert";
import WorkSessionService from "client/services/work-session";
import { loadProjects, selectProjects } from "./store/projectSlice";
import { loadMetaInfo, selectMetaInfo } from "./store/metaInfoSlice";
import {
  loadShortStats,
  selectShortStats,
  selectWorkSessions,
} from "./store/statsSlice";
import { SuggestionsProvider } from "./pages/timer/suggestions-provider";
import { loadCategories, selectCategories } from "./store/categorySlice";
import { makeGlobalKeypressHandler } from "./util/global-keypress-handler";
import { createHelpPage } from "./pages/help";

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
      main({ client, closeClient: resolve });
    })
);

// ----------------- Main Script ---------------------------------
async function main(arg: { client: Client; closeClient(): void }) {
  const { client } = arg;

  // --------------------- Creating Services ----------------
  // @TODO create them programmatically
  const categoryService = new CategoryService({
    client,
    url: config.API_CATEGORY_PATH,
  });

  const projectService = new ProjectService({
    client,
    url: config.API_PROJECT_PATH,
  });

  const workSessionService = new WorkSessionService({
    client,
    url: config.API_WORK_SESSION_PATH,
  });

  const metaInfoService = new MetaInfoService({
    client,
    url: config.API_META_INFO_PATH,
  });

  const timerService = new TimerService({ url: config.API_TIMER_PATH, client });

  // --------------------- Handling server sent events -------------------

  await client.subscribe(Object.values(BROADCAST_CHANNELS));
  const timerEventsEmitter = new EventEmitter();
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

      case BROADCAST_CHANNELS.META_INFO_BROADCAST_CHANNEL:
        store.dispatch(loadMetaInfo(metaInfoService));
        break;
    }

    store.dispatch(loadShortStats(workSessionService));
  });

  // ----------------- Timer Manager ----------------
  const timerManager = new TimerManager({ key: "1" });

  // ------------------- Creating Components And Pages ---------------
  const suggestionsProvider = new SuggestionsProvider();
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

  const Statistics = createStatsPage({
    debug,
    alert,
    renderScreen,
    timerManager,
    getWorkSessions: ({ date }: { date: string }) =>
      selectWorkSessions({ date, store, workSessionService }),
    getSummaryStats: async () => selectShortStats(store),
  });

  const Help = createHelpPage({ debug, renderScreen });

  const Clock = createClockPage({ debug, renderScreen });

  const pages: { [k: string]: Page } = Object.freeze({
    Help: Help.page,
    Timer: timerPage,
    Clock: Clock.page,
    Projects: Projects.page,
    Categories: Categories.page,
    Statistics: Statistics.page,
  });

  const navbar = new NavigationBar({
    debug,
    showTabSerialNumber: false,

    selected: "Timer",
    style: { selected: { bg: "green", fg: "white" } },
    tabs: [
      "Clock",
      "Timer",
      "Categories",
      "Projects",
      "Statistics",
      { label: "Help (Press F1)", name: "Help" },
    ],
  });

  // ------------- Appending Elements to the screen ---------------------
  screen.append(navbar.element);
  Object.values(pages).forEach((page) => screen.append(page.element));

  screen.append(prompt.element);
  screen.append(alertElement);

  // ---------------- Managing State changes -------------------------
  // @TODO don't update everything. Use redux-watch to update states
  // selectively
  function reloadProjectAndCategoryData() {
    const categories = selectCategories(store);
    const projects = selectProjects(store);
    const shortStats = selectShortStats(store);
    const metaInfo = selectMetaInfo(store);

    suggestionsProvider.update({ project: projects, category: categories });
    Categories.loadCategories(categories);
    Projects.loadProjects(projects);

    if (metaInfo) {
      Statistics.setFirstDayOfWeek(metaInfo.firstDayOfWeek);
    }

    Statistics.updateShortStats(shortStats);
  }

  // @TODO don't use subscribe directly
  store.subscribe(() => {
    reloadProjectAndCategoryData();
  });

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
      onHelp: () => {
        navbar.move({ name: "Help" });
        state.currentPage = pages[navbar.selected.name];
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

  // App quit key binding: Control-C.
  screen.key(["C-c"], async function () {
    arg.closeClient(); // this will disconnect the client from the server
    screen.destroy();
    Clock.stopUpdating();
    timerManager.clear("1");
    process.exitCode = 0;
  });

  // --------- Rendering the screen and showing the first page --------------
  state.currentPage.show();
  renderScreen();

  // ---------- Loading Initial Application States ------------------------

  // loading initial timer states
  timerEventsEmitter.emit("tick", await timerService.getInfo());

  // loading initial states
  store.dispatch(loadCategories(categoryService));
  store.dispatch(loadProjects(projectService));
  store.dispatch(loadMetaInfo(metaInfoService));
  store.dispatch(loadShortStats(workSessionService));
}
