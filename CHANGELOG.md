## v0.9.0 (26 August 2016)
- Added `word` and `line` variables.
- Added `selectProjectPath` variable.
- Added `trim` transform.

## v0.8.3 (15 July 2016)
- Added prompt for saving if files are modified.

## v0.8.2 (24 June 2016)
- Added entry to command palette to rerun last command.
- Added ability to convert paths between platforms.
- Changed command text field to a multi-line editor.

## v0.8.1 (6 April 2016)
- Added button to editor to toggle panel.
- Fixed layout issue in editor that caused center panel to expand.

## v0.8.0 (5 April 2016)
- Added ability to run only one instance at a time.
- Added divider and reload button to editor.
- Added prompt when unsaved changes are detected.
- Apply open configurations when reloading.
- Added removing of key bindings when reloading configuration.

## v0.7.1 (31 March 2016)
- Added buttons for inserting variables.

## v0.7.0 (7 March 2016)
- Added graphical editor for configuration files.

## v0.6.0 (2 January 2016)
- Added user input dialogs for variables. `@toi333`
- Allow `filePath` to be acquired from non-editor panes. `@nalcorso`
- Fixed output of formatted text when a file path is detected.

## v0.5.5 (26 December 2015)
- Changed output colors to white on black.
- Added separate commands for showing and hiding panel.
- Added ability to detect paths and open files from output.

## v0.5.3 (20 November 2015)
- Escape HTML and convert ANSI escape sequences. `@toddmazierski`

## v0.5.2 (21 October 2015)
- Added `autoHideOutput` property.

## v0.5.1 (20 September 2015)
- Added `scrollLockEnabled` property.
- Changed white space format in output panel.

## v0.5.0 (11 September 2015)
- Added `file` output target for writing output to a new file.
- Added support for running multiple instances of a process.
- Added `autoShowOutput` property for automatically showing the output panel.
- Added `maxCompleted` property to limit number of completed processes.
- Made warning notification dismissible.
- Changed output processing to buffer output even when streaming.
- Added `outputBufferSize` property to set maximum size of output buffer.
- Changed the default value of `errorOutput` to include `{stdout}`.

## v0.4.12 (28 August 2015)
- Added ability to resize panel.
- Added panel size and visibility to package state.
- Added ability to clear output.
- Added scroll lock behavior to output panel.
- Changed output panel's font to mono spaced.

## v0.4.11 (26 August 2015)
- Added option to stream output.

## v0.4.10 (23 August 2015)
- Added ability to configure additional environment variables.
- Replaced BufferedProcess with shelljs to run commands with.

## v0.4.9 (10 August 2015)
- Changed the way the projectPath field is determined. fileProjectPath is now used to refer to the project path of the currently open file, whereas projectPath refers to the first project or the process-palette.json folder if no projects are open.

## v0.4.6 (9 August 2015)
- Updated readme with instructions to use new help panel.
