import type { Client } from "express-ipc";

export interface ClientServiceArgument {
  url: string;
  client: Client;
}
