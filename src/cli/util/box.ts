import colors from "ansi-colors";
import { dynamicImport } from "./import";

export interface printObjectAsBox_Argument {
  object: object;
}
export async function printObjectAsBox(arg: printObjectAsBox_Argument) {
  const { object } = arg;

  const keyValuePair = Object.entries(object);
  const maxKeyNameLength = keyValuePair.reduce(
    (maxLength, [key]) => Math.max(maxLength, key.length),
    -Infinity
  );

  keyValuePair.sort(([kA, vA], [kB, vB]) => {
    const diff = String(vA).length - String(vB).length;
    // if both has the same length then sort by the key fields
    return diff ? diff : kA.length - kB.length;
  });

  let content = "";
  keyValuePair.forEach(([key, value], index) => {
    if (value === undefined) return;

    if (index) content += "\n";
    content += `${colors.green(key + ": ")}${" ".repeat(
      maxKeyNameLength - key.length
    )}${colors.white(String(value))}`;
  });

  const { default: boxen } = await dynamicImport("boxen");
  const box = boxen(content, {
    padding: 1,
    borderStyle: "round",
  });

  console.log(box);
}
