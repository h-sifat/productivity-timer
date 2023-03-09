# Productivity Timer

A CLI/TUI Pomodoro timer and todo (coming soon) app for the keyboard addicts and
terminal fans.

## Navigation

1. Move to next tab: `ctrl + l` or `ctrl + right-arrow`
1. Move to previous tab: `ctrl + h` or `ctrl + left-arrow`
1. Focus next element on page: `ctrl + j` or `ctrl + down-arrow`
1. Focus previous element on page: `ctrl + k` or `ctrl + up-arrow`

**Note:** `ctrl - up/down` won't work when the currently focused element is a
form element.

## App

1. Quit: `ctrl + c`

## Form

1. Date format: `mm/dd/yyyy` e.g., `1/2/2023` for `Jan 2nd 2023`
1. Duration examples: `1h20m`, `20m30s`, `1h30s` etc.

## Tips

1. All instructions texts are scrollable with mouse. Hover your mouse pointer on
   any instruction text and roll the mouse wheel up or down.
1. Generally a focused element is highlighted with a green border.

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
  "DB_BACKUP_DIR": "/home/muhammad/.p-timer-bak"
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

**Tip:** All the duration fields ending with `_MS` can either take a
milliseconds number value or descriptive duration string value (e.g., `"20m"`,
`"1h30m"` etc.).

## CLI

Run `pt --help` to learn about the CLI.

## Troubleshooting

**1.** The audio is not working.

**Ans:** Make sure that `mplayer` is installed and available in your systems
`PATH` variable. This shouldn't be an issue on unix machines but on windows you
may have to set the `MPLAYER_PATH` manually in the config file (`~/.ptrc.json`).

**2.** It says database is corrupted or can't save work session.

**Ans:** Did you or any of your program mess with the `p-timer.db` file? If yes
then see if you have a backup in your `DB_BACKUP_DIR`. Remove the `p-timer.db`
file from your `DATA_DIR` directory and reboot the server. It should pick up the
backed up database file.

Otherwise, file a Github issue with the `logs.txt` file in your `DATA_DIR`
directory.

**3.** I've accidentally deleted my projects/categories!

**Ans:** Quickly close the server with `pt quit` and see if you have any
backup available. Follow the number **2** troubleshooting guide above.

**4.** Something else!

Please file a Github issue at `https://github.com/h-sifat/productivity-timer.git`

## About

Developed by **Muhammad Sifat Hossain** with frustration, depression, boredom
and love. Feel free to reach out (`reach@sifat.cc`) if you have any questions.
