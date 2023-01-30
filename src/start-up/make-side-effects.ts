import type { Server } from "express-ipc";

export interface makeSideEffectObject {
  server: Server;
  channel: string;
  methods: string[];
}
export function makeServiceSideEffects<T>(arg: makeSideEffectObject): T {
  const { server, channel, methods } = arg;

  return methods.reduce((sideEffectObject, method) => {
    sideEffectObject[method] = (arg: any) => {
      server.broadcast({ channel, data: { event: method, data: arg } });
    };
    return sideEffectObject;
  }, {} as any);
}
