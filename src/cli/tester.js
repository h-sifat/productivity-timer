/*
 * This is a helper cli to test the timer manager.
 *
 * Syntax: `command [arg]`
 * Note: if the arg is a string then we need to surround it with quotes.
 *
 * To clear the console use the "clear" command. e.g. `> clear`
 * To list all the aliases use the "pa" (print_aliases) command
 *
 * Examples:
 * 1. For `timerManager.execute({command: "START", arg: "coding"})`
 * We can use this cli as : `> st "coding"`
 * 1. For `timerManager.execute({command: "CREATE", arg: {name: "test", duration: 5, unit: "s"}})`
 * use: `c {name: "test", duration: 5, unit: "s"}`
 *
 * See the command map below.
 * */
const vm = require("vm");
const timerManager = require("../timer_manager");

const context = { arg: null, error: null };
vm.createContext(context);

const commandAliases = Object.freeze({
  e: "END",
  i: "INFO",
  se: "SAVE",
  r: "RESET",
  p: "PAUSE",
  c: "CREATE",
  st: "START",
  ss: "STATS",
  sb: "STOP_BEEPING",
  uc: "UPDATE_CONFIG",
  lst: "LIST_SAVED_TIMERS",
  dst: "DELETE_SAVED_TIMER",
});

main();

async function main() {
  await timerManager.init();

  process.stdout.write("> ");
  process.stdin.on("data", async (data) => {
    await parse(data.toString().slice(0, -1));
    process.stdout.write("> ");
  });
}

const delimiter = " ";
async function parse(line) {
  line = line.trim();
  const delimiterIndex = line.indexOf(delimiter);

  let commandAlias,
    argString = undefined;
  if (delimiterIndex > 0) {
    commandAlias = line.slice(0, delimiterIndex);
    argString = line.slice(delimiterIndex + 1);
  } else commandAlias = line;

  if (commandAlias === "clear") return console.clear();
  // pa = "print aliases"
  if (commandAlias === "pa") return console.log(commandAliases);

  const command = commandAliases[commandAlias];
  if (!command) return console.error(`Invalid command: ${commandAlias}`);

  const code = `
  try {
    arg = ${argString};
    error = null;
  } catch (ex) {
    arg = null; 
    error = ex;
  }
  `;

  vm.runInContext(code, context);

  if (context.error) return console.error(context.error);

  const result = await timerManager.execute({ command, arg: context.arg });
  console.log(result);
}
