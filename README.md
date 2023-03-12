# Productivity Timer

A CLI/TUI Pomodoro timer and todo (coming soon) app for the keyboard addicts and
terminal fans.

![productivity_timer demo](https://user-images.githubusercontent.com/80267830/223765835-e02cc6d0-bb17-492f-9cd6-f25776bf1653.gif)

## Features

This application is **21k+** lines of code (including tests) terminal madness
and packed with features. It

- can be be used entirely from the CLI (you don't have to switch to another
  window to interact with a Pomodoro app anymore)
- has a sleek and (almost) responsive TUI
- plays alarm beep after every non-break timer ends
- can show notifications
- can show comprehensive stats (in the TUI)
- has automatic database backup
- it's fast! It uses IPC socket for CLI/TUI to backend service
  communication.
- is reactive to changes. Changes from any TUI instance or CLI is reflected
  everywhere.

## Installation

If you don't have Node.js installed then go ahead and install it from
[here](https://nodejs.org/) and run the following command in your terminal /
command prompt.

```bash
npm install --location=global productivity-timer
```

**Productivity timer** depends on the **mplayer** CLI for playing audio. It
should be accessible globally in your shell as the `mplayer` command. If it's
not globally available in the shell then you can manually provide the `mplayer`
binary path in the config.

### Installing `mplayer`

**On Arch - based systems**

```bash
sudo pacman -S mplayer
```

**On Debian systems:**

```bash
sudo apt install mplayer
```

**On MacOS with homebrew:**

```bash
brew install mplayer
```

**On Windows and other OSs:** Please visit the [official mplayer
website](http://www.mplayerhq.hu) for download instructions.

After installation run `pt -v` to verify. It should print the current version of
the app.

## Usages

**Productivity Timer** doesn't enforce strict Pomodoro sequence
(`work -> break -> work`). It's entirely up to you when and how you start a
timer.

If a timer has reference to a task category or a project it'll be saved and
show up in your stats. Otherwise, it'll be considered as a break timer. So
break sessions are not logged in the database, it's only your hard work that
counts!

#### CLI

Kindly read the **help** page (with `pt --help`) to learn about all the
features.

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

# after above timer times up start a short break (5m)
pt break -s # or: pt b -s

# shortcut to start the study timer again
pt start --last # or: pt s -l
```

**Tip:**

1. When the timer is beeping you can mute it by issuing the mute command. e.g.,
   `pt mute`.
1. Don't worry about writing long commands. Almost every command has a
   single character alias.

#### TUI

```bash
# before starting the TUI start the server
pt bootup

# start the TUI
pt tui
```

When in the TUI press <kbd>F1</kbd> to see the help page.

## Configuration

This app depends on a config file named `~/.ptrc.json`. Here `~/` means your
**home** directory/folder.

**Tip:** If you're not sure what is your home directory then run
`node -p 'os.homedir()'` in your terminal/command prompt.

**Example Configuration:**

```json
{
  // timer
  "BEEP_DURATION_MS": "10s",
  "DEFAULT_TIMER_DURATION_MS": "10m",
  "SHOW_TIMER_NOTIFICATIONS": true,

  // speaker
  "SPEAKER_VOLUME": 40,
  "MPLAYER_PATH": "mplayer",
  "MPLAYER_AUDIO_PATH": "/home/muhammad/alarm.mp3",

  // database
  "DB_BACKUP_INTERVAL_MS": 3600000,
  "DATA_DIR": "/home/muhammad/.p-timer",
  "DB_BACKUP_DIR": "/home/muhammad/.p-timer-bak",

  // tui
  "FIRST_DAY_OF_WEEK": "Mon"
}
```

**Descriptions:**

#### Timer

1. `BEEP_DURATION_MS`: for how long the beep should be played when a timer times
   up.

1. `DEFAULT_TIMER_DURATION_MS`: this value will be used to start a timer when no
   duration is provided.

1. `SHOW_TIMER_NOTIFICATIONS`: whether the app should show a notification when a
   timer ends.

#### Speaker

1. `MPLAYER_PATH`: this app uses the `mplayer` audio player to play the alarm.
   If the `mplayer` command is not available in your shell then you can manually
   specify the `mplayer` binary path in this field.

1. `MPLAYER_AUDIO_PATH`: path to a custom audio file.

1. `SPEAKER_VOLUME`: An integer value for the speaker volume. **0** for mute and
   **100** for maximum.

**Note:** All path must be absolute, i.e. should start from your root directory.
Example: `/home/muhammad/alarm.mp3`

#### Database

1. `DATA_DIR`: the directory where the sqlite database and error logs should be
   stored.

1. `DB_BACKUP_DIR`: the database backup directory.

1. `DB_BACKUP_INTERVAL_MS`: database backup interval timer. I recommend setting
   this to `1h` to be on the safe side.

#### TUI

1. `FIRST_DAY_OF_WEEK`: The TUI depends on this field to render calendar(s).
   Example day names: `"Saturday"`, `"Sat"` or `"Sa"`.

**Tip:** All the duration fields ending with `_MS` can either take a
milliseconds number value or descriptive duration string value (e.g., `"20m"`,
`"1h30m"` etc.).

## Privacy Policy

I have the utmost respect for your privacy and zero interest in your personal
data. Whatever data you generate with this app lives in your own machine and it
doesn't make any network requests. But the sqlite database is unencrypted
though!

## Known Issues

**1.** The app shows the background color of my terminal!

**Ans:** The library I'm using to build the TUI is called **blessed**. It's a
very old library and it hasn't been updated in the last **seven years.** It
doesn't support inheritance for background color styling. So to fix this I've to
manually assign a background color to every element. Even if I assign a value of
"#000" it doesn't become as black as my terminal background. So yeah, it's a
feature.

**2.** The line-char in the stats page is responsive.

**Ans:** It's probably intended by **blessed-contrib** as drawing that line is
probably expensive. Not sure if I should create a new line-chart element after
every resize.

**3.** Build fails on machines running Node 19+ because `better-sqlite3` is not compatible yet.
see [related PR](https://github.com/WiseLibs/better-sqlite3/pull/964)

## Tech stack

This project has been made possible with help of following open source libraries
and frameworks. I'm just a lousy developer who have stitched together all this
technologies.

- Backend Service

  - Database: better-sqlite3
  - Validation: zod and handy-types
  - IPC Server: express-ipc
  - Notification: node-notifier

- CLI (commander)

  - Text formatting: ansi-colors
  - Table: cli-table
  - Box: boxen

- TUI (blessed + blessed-contrib)

  - State management: redux
  - Pie chart: cli-pie
  - Terminal Canvas: drawille-canvas
  - Fuzzy search: fuse.js
  - Tree printing: flexible-tree-printer

- Other
  - Date utilities: date-fns
  - Utils: lodash

## Todo

This app is far from being complete. I still have to implement so many features.

- [x] Remove the overengineered sub-process database layer.
- [ ] Add todo feature.
- [ ] Replace nasty validation logic with zod schemas.
- [ ] Write code documentation.
- [ ] Don't refresh stats in the TUI for unrelated changes. Use `redux-watch` to
      selectively update stats.

## Development

```bash
# running test
npm test
npm run test:watch # in watch mode
npm run test:coverage # to see test coverage

# building
npm run build:watch # run build in watch mode
npm run build:dev
npm run build:prod # the debug log won't be visible in the TUI

# formatting
npm run format
```

## Conclusion

My main inspiration in building this app was that, I didn't like to move my
hands from the keyboard to start a Pomodoro timer. Now I can be more productive
and never leave VIM and my terminal. Though, ironically I spent more than three
months building this thing. I guess that's productivity at the peak 😅.

If you like this app, give it a ⭐ on Github and share it with others. You can
also buy me a coffee if you want 💝.

<a href="https://www.buymeacoffee.com/sifathossain" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>
