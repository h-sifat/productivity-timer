export type LogType = "success" | "error" | "info" | "normal" | "fatal_error";
export interface Log {
  (
    arg: { message: string; indentLevel?: number; type?: LogType } | string,
    indentLevel?: number
  ): void;
  info(message: string, indentLevel?: number): void;
  error(message: string, indentLevel?: number): void;
  success(message: string, indentLevel?: number): void;
}
