const nodeNotifier = require("node-notifier");
const NOTIFICATION_TITLE = "Pomodoro Timer";

async function notify(arg) {
  if (typeof arg === "string")
    nodeNotifier.notify({
      title: NOTIFICATION_TITLE,
      message: arg,
    });
  else if (typeof arg === "object" && arg !== null) nodeNotifier.notify(arg);
  else throw new Error(`Invalid argument to notifier.`);
}

module.exports = notify;
