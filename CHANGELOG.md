## v0.5.1 (20 September 2015)
- Added `scrollLockEnabled` property.

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
