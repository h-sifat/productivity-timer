const { spawn } = require("child_process");
const { makeEnum } = require("../util");

const MPLAYER_TOGGLE_PAUSE_CMD = "p\n";

const player = spawn(
  "mplayer",
  ["-nogui", "-slave", "-really-quiet", "-loop", "0", "alarm_beep.mp3"],
  {
    cwd: __dirname,
  }
);

const toggleSpeaker = () => player.stdin.write(MPLAYER_TOGGLE_PAUSE_CMD);

// Immediately turn off the speaker after spawning it.
toggleSpeaker();

const SPEAKER_STATES = makeEnum({ keys: ["OFF", "ON"], startingValue: 0 });

let speakerState = SPEAKER_STATES.OFF;

function on(timeout) {
  if (speakerState === SPEAKER_STATES.ON) return;

  speakerState = SPEAKER_STATES.ON;
  toggleSpeaker();

  if (timeout) setTimeout(off, timeout);
}

function off() {
  if (speakerState === SPEAKER_STATES.OFF) return;

  speakerState = SPEAKER_STATES.OFF;
  toggleSpeaker();
}

const speaker = { on, off };

module.exports = speaker;
