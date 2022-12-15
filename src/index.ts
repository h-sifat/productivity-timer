import { getConfig } from "./config";
import { makeServices } from "./make-services";
import { makeAllDatabase } from "./data-access";
import { Server } from "express-ipc/dist/server";
import { configureApplication } from "./configure";
import { makeControllers } from "./make-controllers";
import { makeExpressIPCMiddleware } from "./server/util";

async function initApplication() {
  await configureApplication({ log: async (arg) => console.log(arg) });
  const config = getConfig();

  function notifyDatabaseCorruption(arg: any) {
    console.dir(arg, { depth: null });
  }

  const databases = await makeAllDatabase({ notifyDatabaseCorruption });

  databases.database.on("db_subprocess:crashed", (arg) => {
    console.log("db subprocess crashed");
    console.dir(arg, { depth: null });
  });

  databases.database.on("db_subprocess:re_spawned", async () => {
    console.log("Db subprocess re_spawned");
  });

  const services = makeServices({ databases });
  const controllers = makeControllers({ services });

  const server = new Server();

  for (const method of ["get", "post", "patch", "delete"] as const) {
    const controllerAndPathPairs = [
      [controllers.project, config.API_PROJECT_PATH],
      [controllers.category, config.API_CATEGORY_PATH],
      [controllers.workSession, config.API_WORK_SESSION_PATH],
    ] as const;

    for (const [controllerGroup, path] of controllerAndPathPairs)
      if (method in controllerGroup)
        server[method](
          path,
          makeExpressIPCMiddleware({
            controller: (controllerGroup as any)[method],
          })
        );
  }

  server.listen({
    deleteSocketBeforeListening: true,
    path: { namespace: "pt_by_sifat", id: "v1_0_0" },
    callback: () =>
      console.log(`server running at socket: "${server.socketPath}"`),
  });
}

initApplication();
