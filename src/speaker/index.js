const { spawn } = require("child_process");
const { makeEnum } = require("../util");

const M_PLAYER_TOGGLE_PAUSE_KEY = "p\n";
const SPEAKER_STATES = makeEnum({ keys: ["OFF", "ON"], startingValue: 0 });

class Speaker {
  #state = SPEAKER_STATES.OFF;
  #player;
  #onCallback;
  #offCallback;
  #offTimeoutId;

  static #instance;
  constructor({ onCallback = () => {}, offCallback = () => {} } = {}) {
    if (Speaker.#instance) return Speaker.#instance;
    Speaker.#instance = this;

    this.#player = spawn(
      "mplayer",
      ["-nogui", "-slave", "-really-quiet", "-loop", "0", "alarm_beep.mp3"],
      {
        cwd: __dirname,
      }
    );

    // immediately turn off the player
    this.#togglePlayer();

    this.#onCallback = onCallback;
    this.#offCallback = offCallback;
  }

  on(timeout) {
    if (this.#state === SPEAKER_STATES.ON) return;

    this.#togglePlayer();
    this.#state = SPEAKER_STATES.ON;

    this.#onCallback();
    if (timeout) this.#offTimeoutId = setTimeout(() => this.off(), timeout);
  }

  off() {
    if (this.#state === SPEAKER_STATES.OFF) return;

    this.#togglePlayer();
    this.#state = SPEAKER_STATES.OFF;

    if (this.#offTimeoutId) clearTimeout(this.#offTimeoutId);
    this.#offCallback();
  }

  #togglePlayer() {
    this.#player.stdin.write(M_PLAYER_TOGGLE_PAUSE_KEY);
  }

  set onCallback(func) {
    this.#assertValueIsFunction({ value: func, name: "onCallback" });
    this.#onCallback = func;
  }
  set offCallback(func) {
    this.#assertValueIsFunction({ value: func, name: "offCallback" });
    this.#offCallback = func;
  }

  #assertValueIsFunction({ value, name }) {
    if (typeof value !== "function")
      throw new Error(`${name} must be a function.`);
  }
}

module.exports = Speaker;
