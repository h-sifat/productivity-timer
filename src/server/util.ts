import type { MiddleWare } from "express-ipc/dist/express/interface";
import type { Controller, Request } from "src/controllers/interface";

export interface MakeExpressIPCMiddleware_Argument {
  controller: Controller;
  debug?: (v: any) => void;
}
export function makeExpressIPCMiddleware(
  factoryArg: MakeExpressIPCMiddleware_Argument
): MiddleWare {
  const { controller, debug = () => {} } = factoryArg;

  return async ({ req, res }) => {
    const controllerRequest: Request = {
      body: req.body,
      path: req.path,
      query: req.query,
      method: req.method,
      params: req.params,
      headers: req.headers,
    };

    try {
      const controllerResponse = await controller(controllerRequest);

      if (controllerResponse.headers)
        for (const [key, value] of Object.entries(controllerResponse.headers))
          (res.headers as any)[key] = value;

      res.send(controllerResponse.body);
    } catch (ex) {
      debug(ex);
      res.send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: `Internal server error.`,
        },
      });
    }
  };
}
