<p align="center">
  <img src="https://user-images.githubusercontent.com/80267830/227173633-15b85265-29ea-4942-a565-07dcc6b5e906.svg" width="200px" align="center" alt="Productivity Timer Logo" />
  <h1 align="center">Productivity Timer</h1>
  <p align="center">
    A CLI/TUI Pomodoro timer and todo (coming soon) application for keyboard addicts
    and terminal fans that makes you more productive.
  </p>
</p>

<p align="center">
<a href="https://github.com/h-sifat" rel="nofollow"><img src="https://img.shields.io/badge/created--by-h--sifat-green" alt="Created by Muhammad Sifat Hossain"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/h-sifat/productivity-timer" alt="License"></a>
<a href="https://www.npmjs.com/package/productivity-timer" rel="nofollow"><img src="https://img.shields.io/npm/dw/productivity-timer.svg" alt="npm"></a>
<a href="https://www.npmjs.com/package/productivity-timer" rel="nofollow"><img src="https://img.shields.io/github/stars/h-sifat/productivity-timer" alt="stars"></a>
</p>

![productivity_timer demo](https://user-images.githubusercontent.com/80267830/223765835-e02cc6d0-bb17-492f-9cd6-f25776bf1653.gif)

## Table of Contents

- [Features](#features)
- [Installing](#installing)
- [Usages](#usages)
  - [CLI](#cli)
  - [TUI](#tui)
- [Configuration](#configuration)
  - [Timer](#timer)
  - [Speaker](#speaker)
  - [Database](#database)
  - [TUI](#tui-1)
- [Integrating with other apps](#integrating-in-other-apps)
- [Privacy Policy](#privacy-policy)
- [Known Issues](#known-issues)
- [Tech Stack](#tech-stack)
- [Todo](#todo)
- [Development](#development)
- [Conclusion](#conclusion)

## Features

This application is **20k+** lines of code (including tests) terminal madness
and packed with features. It

- can be be used entirely from the CLI (you don't have to switch to another
  window to interact with a Pomodoro app anymore)
- has a sleek and (almost) responsive TUI
- plays alarm beep after every non-break timer ends
- can show notifications
- can show comprehensive stats (in the TUI)
- has automatic database backup system
- is reactive to changes. Changes from any TUI instance or CLI is reflected
  everywhere.

[Go to TOC](#table-of-contents)

## Installing

If you don't have Node.js installed then go ahead and install an LTS version
from [here](https://nodejs.org/) and run the following command in your terminal
or command prompt.

```bash
npm install --location=global productivity-timer
```

After installing run `pt -v` to verify, it should print the current version of
the app.

### Updating

To update the app run the following command:

```bash
npm install --location=global productivity-timer@latest
```

### Installing `mplayer`

Productivity Timer depends on the **mplayer** CLI for playing audio. It
should be accessible globally in your shell as the `mplayer` command. If it's
not globally available in the shell then you can manually provide the `mplayer`
binary path in the config.

**On Arch based systems**

```bash
sudo pacman -S mplayer
```

**On Debian based systems:**

```bash
sudo apt install mplayer
```

**On MacOS with homebrew:**

```bash
brew install mplayer
```

**On Windows and other OSs:** Please refer to the [official mplayer
website](http://www.mplayerhq.hu) or your package manager for installation
instructions.

[Go to TOC](#table-of-contents)

## Usages

Productivity Timer doesn’t enforce a strict Pomodoro sequence (work -> break ->
work). It’s entirely up to you when you want to start a timer, though you can
configure the app to automatically start a break after each work session.

If a timer has a reference to a task category or project, it’ll be saved and
show up in your stats. Otherwise, it’ll be considered a break timer and not be
logged. It is only your hard work that counts!

[Go to TOC](#table-of-contents)

### CLI

Kindly read the **help** page (with `pt --help`) to learn about all the
commands.

**Note:** In the help page of the CLI you'll see commands like `pause|p`. Here
`|p` means an alias named `p`.

```bash
# boot up the server
pt bootup

# create a category or project
pt create category --name Study # or use alias: pt c c -n Study

# start a 25m timer for the "Study" category
pt start --category --name study -d 25m # or: pt start -cn study -d 20m

# see the current status
pt info # or: pt i

# after the above timer times up start a short break (5m)
pt break -s # or: pt b -s

# shortcut to start the study timer again
pt start --last # or: pt s -l
```

**Tip:**

1. When the timer is beeping you can mute it by issuing the mute command. e.g.,
   `pt mute`.
1. Don't worry about writing long commands. Almost every command has a
   single-character alias.

[Go to TOC](#table-of-contents)

### TUI

```bash
# before starting the TUI start the server
pt bootup

# start the TUI
pt tui
```

When in the TUI press <kbd>F1</kbd> to see the help page.

[Go to TOC](#table-of-contents)

## Configuration

This app depends on a config file named `~/.ptrc.json`.

**Tip:**

1. Here `~/` means your **home** directory/folder. If you're not sure what is
   your home directory then run `node -p 'os.homedir()'` in your
   terminal/command prompt.
1. The config JSON file supports comments and trailing commas thanks to JSON5.

**Example Configuration:**

```json
{
  // timer
  "BEEP_DURATION_MS": "10s",
  "DEFAULT_TIMER_DURATION_MS": "10m",
  "SHOW_TIMER_NOTIFICATIONS": true,
  "AUTO_START_BREAK": false,
  "AUTO_START_BREAK_DURATION": 300000,

  // speaker
  "SPEAKER_VOLUME": 40,
  "MPLAYER_PATH": "mplayer",
  "MPLAYER_AUDIO_PATH": "/home/muhammad/alarm.mp3",

  // database
  "DB_BACKUP_INTERVAL_MS": 3600000,
  "DATA_DIR": "/home/muhammad/.p-timer",
  "DB_BACKUP_DIR": "/home/muhammad/.p-timer-bak",

  // tui
  "FIRST_DAY_OF_WEEK": "Mon",

  // other
  "CHECK_UPDATE": true
}
```

**Descriptions:**

[Go to TOC](#table-of-contents)

#### Timer

1. `BEEP_DURATION_MS`: for how long the beep should be played when a timer times
   up.

1. `DEFAULT_TIMER_DURATION_MS`: this value will be used to start a timer when no
   explicit duration is provided.

1. `SHOW_TIMER_NOTIFICATIONS`: whether the app should show a notification when a
   timer ends.

1. `AUTO_START_BREAK`: whether the app should automatically start the break
   timer.

1. `AUTO_START_BREAK_DURATION`: the timer duration of automatically started
   breaks.

[Go to TOC](#table-of-contents)

#### Speaker

1. `MPLAYER_PATH`: this app uses the `mplayer` audio player to play the alarm.
   If the `mplayer` command is not available in your shell then you can manually
   specify the `mplayer` binary path in this field.

1. `MPLAYER_AUDIO_PATH`: path to a custom audio file.

1. `SPEAKER_VOLUME`: An integer value for the speaker volume. **0** for mute and
   **100** for maximum.

**Note:** All path must be absolute, i.e. should start from your root directory.
Example: `/home/muhammad/alarm.mp3`

[Go to TOC](#table-of-contents)

#### Database

1. `DATA_DIR`: the directory where the sqlite database and error logs should be
   stored.

1. `DB_BACKUP_DIR`: the database backup directory.

1. `DB_BACKUP_INTERVAL_MS`: database backup interval timer. I recommend setting
   this to `1h` to be on the safe side.

[Go to TOC](#table-of-contents)

#### TUI

1. `FIRST_DAY_OF_WEEK`: The TUI depends on this field to render calendar.
   Example day names: `"Saturday"`, `"Sat"` or `"Sa"`.

#### Other

1. `CHECK_UPDATE`: Whether the app should check for updates and show
   notification.

**Tip:** All the duration fields can either take a milliseconds number value or
a descriptive duration string value (e.g., `"20m"`, `"1h30m"` etc.).

[Go to TOC](#table-of-contents)

## Integrating in other apps

### With the `pt_plugin` CLI

The `pt_plugin` is a lightweight CLI provided by Productivity Timer for easy
integration with other applications that can show status by invoking shell
commands (e.g., Polybar). Right now, it has only one command named `info` that
can either take a template to format status message or output raw JSON.

Run `pt_plugin info --help` to see the command structure.

#### Status Template

**Example**

```bash
pt_plugin info -t "[ref] | [ed]/[td] | [state]"
# will print something like: 'p(2)/Timer | 00:00:06/01:00:00 | RUNNING'
```

**Syntax**

You can write anything in the template and to interpolate a variable, write it
inside `[]`. To escape the `[` and `]` characters use `%` and to write a single
`%` write `%%`.

**Examples**

```bash
pt_plugin info -t "Elapsed time: [ed]"
# example output: 'Elapsed time: 01:23'

pt_plugin info -t "Elapsed time%% %[[ed]%]"
# example output: 'Elapsed time% [01:23]'
```

**Available Variables**

1. `ref`: the timer reference. It will be formatted as `[pc](id)/name`. Here `c`
   and `p` means task category and project respectively. If ref is `null` i.e.
   it's a break timer then it'll be set to the string `"Break"`. Also the `name`
   field is truncated to **15** characters.

1. `state`: timer states: `ENDED`, `PAUSED`, `RUNNING`, `TIMED_UP`, and
   `NOT_STARTED`.

1. `td`: target duration.
1. `ed`: elapsed duration.
1. `rd`: remaining duration.

**Tip:** Checkout [executor](https://github.com/raujonas/executor) if you're
using Gnome. It can show the output of any shell command in your top panel.

#### JSON

If the template doesn't suit your needs then you can provide the `--json` flag
to get the raw JSON data.

```bash
pt_plugin info --json
```

The response data has the following interface:

```ts
type InfoCommandResponse =
  | { error: null; data: any }
  | { error: { message: string; code: string }; data: null };
```

### With Node.js

You can programmatically communication with Productivity Timer through IPC
socket.

1. Install [express-ipc](https://github.com/h-sifat/express-ipc)
1. Copy the config from `src/config/other.ts` module and the client services
   from `src/client/services` directory.

**Example:** see the `docs/api-integration.ts` file.

[Go to TOC](#table-of-contents)

## Privacy Policy

I have the utmost respect for your privacy and zero interest in your personal
data. Whatever data you generate with this app lives in your own machine and it
doesn't make any network requests except for update check (you can turn it off).
But the sqlite database is unencrypted though and is accessible to every
application running on your system!

[Go to TOC](#table-of-contents)

## Known Issues

**1.** The app shows the background color of my terminal!

The library I'm using to build the TUI is called **blessed**. It's a
very old library and it hasn't been updated in the last **seven years.** It
doesn't support inheritance for background color styling. So to fix this I've to
manually assign a background color to every element. Even if I assign a value of
"#000" it doesn't become as black as my terminal background. So yeah, it's a
feature!

**2.** The line-chart in the stats page of TUI is not responsive.

It's probably intended by **blessed-contrib** as drawing that line is
probably expensive. Not sure if I should create a new line-chart element after
every resize event.

[Go to TOC](#table-of-contents)

## Tech stack

This project has been made possible with help of following open source libraries
and frameworks. I'm just a lousy developer who have stitched together all this
technologies. Long live open source!

- Backend Service

  - Database: better-sqlite3
  - Validation: zod and handy-types
  - IPC Server: express-ipc
  - Notification: node-notifier

- CLI (commander)

  - IPC Client: express-ipc
  - Text formatting: ansi-colors
  - Table: cli-table
  - Box: boxen

- TUI (blessed + blessed-contrib)

  - Pie chart: cli-pie
  - Fuzzy search: fuse.js
  - State management: redux
  - Terminal Canvas: drawille-canvas
  - Tree printing: flexible-tree-printer

- Other
  - Utils: lodash
  - Date utilities: date-fns

[Go to TOC](#table-of-contents)

## Todo

This app is far from being complete. I still have to implement so many features.
If you think you can help me to implement some features then please do so. It's
becoming very tiresome for me to do everything singlehandedly.

- [ ] Add todo feature.
- [ ] Write code documentation.
- [ ] Replace nasty validation logic with zod schemas.
- [x] Remove the overengineered sub-process database layer.
- [x] Don't refresh stats in the TUI for unrelated changes. Use `redux-watch` to
      selectively update stats.

[Go to TOC](#table-of-contents)

## Development

```bash
# running tests
npm test
npm run test:watch # in watch mode
npm run test:coverage # to see test coverage

# building
npm run build:dev:watch # run build in watch mode
npm run build:dev
npm run build:prod # the debug log won't be visible in the TUI

# formatting
npm run format
```

[Go to TOC](#table-of-contents)

## Conclusion

My main inspiration in building this app was that, I didn't like to move my
hands from the keyboard to start a Pomodoro timer. Now I can be more productive
and never leave VIM and my terminal. Though, ironically I've spent more than
five months building this app. I guess that's productivity at the peak 😅. But
that's not the point. I actually learned a lot (sqlite, child process
management, blessed, redux ...) while building this app and also built an entire
IPC server framework ([express-ipc](https://github.com/h-sifat/express-ipc))
from scratch.

If you like this app, give it a ⭐ on Github and share it with others. You can
also buy me a coffee if you want, I would really appreciate that 💝.

<a href="https://www.buymeacoffee.com/sifathossain" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" width="217" >
</a>
