use std::{error::Error, io};

use ratatui::{
    Terminal,
    backend::{Backend, CrosstermBackend},
    crossterm::{
        event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
        execute,
        terminal::{EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode},
    },
};

mod app;
mod ui;
use crate::{
    app::{App, CurrentScreen, CurrentlyEditing},
    ui::ui,
};

fn main() -> Result<(), Box<dyn Error>> {
    // setup terminal
    enable_raw_mode()?;
    let mut stderr = io::stderr(); // This is a special case. Normally using stdout is fine
    execute!(stderr, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stderr);
    let mut terminal = Terminal::new(backend)?;

    // create app and run it
    let mut app = App::new();
    let res = run_app(&mut terminal, &mut app);

    // restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    match res {
        Ok(do_print) => {
            if do_print {
                app.print_json()?
            }
        }
        Err(err) => println!("{err:?}"),
    }

    Ok(())
}

fn run_app<B: Backend>(terminal: &mut Terminal<B>, app: &mut App) -> io::Result<bool>
where
    io::Error: From<B::Error>,
{
    loop {
        terminal.draw(|f| ui(f, app))?;

        let key = match event::read()? {
            Event::Key(key) if key.kind == event::KeyEventKind::Press => key,
            _ => continue,
        };

        match app.current_screen {
            CurrentScreen::Main => match key.code {
                KeyCode::Char('e') => {
                    app.current_screen = CurrentScreen::Editing;
                    app.currently_editing = Some(CurrentlyEditing::Key);
                }
                KeyCode::Char('q') => {
                    app.current_screen = CurrentScreen::Exiting;
                }
                _ => {}
            },

            CurrentScreen::Exiting => match key.code {
                KeyCode::Char('y') => return Ok(true),
                KeyCode::Char('n') | KeyCode::Char('q') => return Ok(false),
                _ => {}
            },

            CurrentScreen::Editing => match key.code {
                KeyCode::Enter => {
                    if let Some(editing) = &app.currently_editing {
                        match editing {
                            CurrentlyEditing::Key => {
                                app.currently_editing = Some(CurrentlyEditing::Value);
                            }
                            CurrentlyEditing::Value => {
                                app.save_key_value();
                                app.current_screen = CurrentScreen::Main;
                            }
                        }
                    }
                }

                KeyCode::Backspace => {
                    if let Some(editing) = &app.currently_editing {
                        match editing {
                            CurrentlyEditing::Key => app.key_input.pop(),
                            CurrentlyEditing::Value => app.value_input.pop(),
                        };
                    }
                }

                KeyCode::Esc => {
                    app.current_screen = CurrentScreen::Main;
                    app.currently_editing = None;
                }

                KeyCode::Tab => {
                    app.toggle_editing();
                }

                KeyCode::Char(value) => {
                    if let Some(editing) = &app.currently_editing {
                        match editing {
                            CurrentlyEditing::Key => app.key_input.push(value),
                            CurrentlyEditing::Value => app.value_input.push(value),
                        };
                    }
                }

                _ => {}
            },
        }
    }
}
