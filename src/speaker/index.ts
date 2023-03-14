import * as fs from "fs";
import EPP from "common/util/epp";
import { assert } from "handy-types";
import { Notify } from "common/interfaces/other";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export interface spawnMPlayer_Argument {
  volume?: number;
  audioPath: string;
  mPlayerPath: string;
}

/**
 * @WARNING the audioPath should be absolute
 * */
function spawnMPlayer(arg: spawnMPlayer_Argument) {
  const { mPlayerPath, audioPath } = arg;

  try {
    fs.accessSync(audioPath, fs.constants.R_OK);
  } catch (ex) {
    throw new EPP({
      code: "MPLAYER_AUDIO_NOT_ACCESSIBLE",
      message: `The mplayer audio file ("${audioPath}") is either deleted or inaccessible.`,
    });
  }

  const { volume = 80 } = arg;
  return spawn(
    mPlayerPath,
    [
      "-nogui",
      "-slave",
      "-really-quiet",
      "-softvol",
      "-volume",
      String(volume),
      "-loop",
      "0",
      audioPath,
    ],
    { cwd: __dirname }
  );
}

const M_PLAYER_TOGGLE_KEY_SEQUENCE = "p\n";

export type SpeakerConstructor_Argument = Required<spawnMPlayer_Argument> & {
  notify: Notify;
};
export class Speaker {
  #isPlaying: boolean;
  #player: ChildProcessWithoutNullStreams;
  #pauseTimerId: NodeJS.Timeout | null = null;
  readonly #spawnPlayerArgument: spawnMPlayer_Argument;
  readonly #notify: Notify;

  constructor(arg: SpeakerConstructor_Argument) {
    {
      const { mPlayerPath, audioPath, volume, notify } = arg;
      this.#spawnPlayerArgument = Object.freeze({
        volume,
        audioPath,
        mPlayerPath,
      });

      this.#notify = notify;
    }

    this.#player = this.#createAndInitPlayer(this.#spawnPlayerArgument);
    // by default mplayer starts playing the audio
    this.#isPlaying = true;
    this.pause();
  }

  #createAndInitPlayer(arg: spawnMPlayer_Argument) {
    const player = spawnMPlayer(arg);

    this.#registerPlayerEventListeners(player);
    return player;
  }

  #registerPlayerEventListeners(player: ChildProcessWithoutNullStreams) {
    player.on("exit", this.handlePlayerExit);
    player.on("error", this.handlePlayerError);
  }

  #removePlayerEventListeners(player: ChildProcessWithoutNullStreams) {
    player.removeListener("exit", this.handlePlayerExit);
    player.removeListener("error", this.handlePlayerError);
  }

  handlePlayerError = (error: any) => {
    let message: string;
    // the m-player path is invalid or doesn't exist
    if (error.code === "ENOENT")
      message = `Speaker Error: the "mplayer" binary is not found.`;
    else message = `Speaker Error: ${String(error.message)}`;

    this.#notify(message);
  };

  handlePlayerExit = () => {
    this.#notify(`The mplayer process died. Trying to respawn.`);

    this.#removePlayerEventListeners(this.#player);

    this.#player = this.#createAndInitPlayer(this.#spawnPlayerArgument);
    this.#isPlaying = true;
    this.pause();
  };

  play(arg: { timeout?: number } = {}) {
    if (this.#isPlaying) return;

    this.#togglePlayer();
    this.#isPlaying = true;

    if (!arg.timeout) return;

    const { timeout } = arg;
    assert<number>("positive_integer", timeout, {
      name: "play-timeout",
      code: "INVALID_TIMEOUT",
    });

    this.#pauseTimerId = setTimeout(this.pause, timeout);
  }

  pause = () => {
    if (!this.#isPlaying) return;

    this.#togglePlayer();
    this.#isPlaying = false;

    if (this.#pauseTimerId) clearTimeout(this.#pauseTimerId);
  };

  #togglePlayer() {
    this.#player.stdin.write(M_PLAYER_TOGGLE_KEY_SEQUENCE);
  }

  close() {
    if (!this.#player) return;

    this.#removePlayerEventListeners(this.#player);
    this.#player.kill();
  }

  get isPlaying() {
    return this.#isPlaying;
  }
}
