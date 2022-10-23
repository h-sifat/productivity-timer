export interface Headers {
  [key: string]: unknown;
  "Content-Type"?: "json";
}

export interface Request {
  body: any;
  query: any;
  params: any;
  path: string;
  headers: Headers;
  method: "get" | "post" | "delete" | "patch";
}

export interface Response {
  headers?: Headers;
  body: object | object[];
  error: null | { message: string; code?: string };
}

export type Controller = (request: Request) => Promise<Response>;
