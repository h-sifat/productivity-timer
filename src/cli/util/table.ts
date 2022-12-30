import Table from "cli-table";

export interface printTables_Argument {
  columns: string[];
  objects: object[];
}
export function printTables(arg: printTables_Argument) {
  const { columns, objects } = arg;

  const rows = objects.map((object: any) =>
    columns.map((key: any) => String(object[key] ?? ""))
  );

  const table = new Table({
    rows,
    head: columns,
    style: { head: ["green"], compact: true },
  });
  console.log(table.toString());
}
