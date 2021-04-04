# Process Palette
Run parameterized shell commands from Atom.

## Terminals are now supported!
You can now configure a command to run in an embedded terminal. This allows you to provide input when prompted. You can also simply add a terminal without configuring a command for general purpose use.

## Highlights:
- Parameterize commands with values from the workspace, e.g, file path, project path, selected text, etc.
- Add entries to the command palette with optional shortcut keys for each command.
- Define parameterized environment variables.
- Run multiple instances of commands in parallel.
- Provides a convenient graphical editor. No need to edit configuration files directly unless you want to.
- Integrates with the project tree. Select a file in the project tree and choose which command to run it with.
- Detects paths and line numbers in the output that links back to the editor.
- Add hooks for custom JavaScript to run before and after a process.
- Open embedded terminals and optionally configure its working directory and environment variables.

See the [changelog](https://github.com/morassman/process-palette/raw/master/CHANGELOG.md) for the latest improvements.

## Examples
### Add a command for running Python scripts

![demo](https://github.com/morassman/process-palette/raw/master/resources/demo.gif?raw=true)

<a name="tree_view_example"></a>
### Run commands that target files directly from the project tree

![demo](https://github.com/morassman/process-palette/raw/master/resources/demo2.gif?raw=true)


### Add a terminal

![demo](https://github.com/morassman/process-palette/raw/master/resources/demo3.gif?raw=true)

## Quick Start
Install Process Palette and then either generate or download a configuration file.

### Generate Configuration
1. Open the Process Palette panel by choosing `Packages|Process Palette|Toggle` from the menu or `Process Palette: Toggle` from the command palette. The following panel will appear:
![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/help.png?raw=true)
2. Create a global configuration or a project specific configuration with the respective `Do it!` buttons. If a project specific configuration is created and more than one project is open then one can be chosen from the dialog box that will appear.
3. Either of the `Do it!` buttons will create an example configuration file and open it in the graphical editor.
4. Configuration files can be edited graphically by choosing `Packages|Process Palette|Edit Configuration` from the menu or `Process Palette: Edit Configuration` from the command palette. Closing the editor will automatically reload the configuration. The `process-palette.json` file can also be edited directly, but then it needs to be reloaded by running `Process Palette: Reload Configuration`.

### Download Configuration
1. Download the example [process-palette.json][2f6a8e37] configuration file and place it in the root of your project folder.
2. Load the new configuration file by choosing `Packages|Process Palette|Reload Configuration` from the menu or `Process Palette: Reload Configuration` from the command palette.

  [2f6a8e37]: https://github.com/morassman/process-palette/raw/master/examples/process-palette.json "process-palette.json"

These example configurations define a command that will echo a message to standard output. It can be run by choosing `Process Palette: Echo Example` from the command palette. This will open the Process Palette panel and show the output. The panel can also be opened directly by pressing `Ctrl-Alt-P` or running `Process Palette: Toggle` from the command palette.

It also contains an example called `Stream Example` to show the direct stream ability. When streaming is enabled the output is written directly to the target without being formatted.

### Next Steps
1. Play with the graphical editor or poke around in the configuration file a bit. Just remember to run the `Process Palette: Reload Configuration` command when making changes directly to the `process-palette.json` file.
2. Read the rest of this document. Especially the **Properties** and **Variables** sections for extra flexibility.

## Graphical Editor
The graphical editor makes it easier to edit the configuration files. It can be opened by choosing `Process Palette: Edit Configuration` from the command palette. A dialog will pop up from where you can choose to edit either the global configuration or a project specific configuration. The following is a screenshot of the graphical editor.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/editor.png?raw=true)

The commands are listed on the left. Selecting one will show its details on the right. Pressing the `Edit Patterns` button allows you to define custom patterns for recognizing file paths and line numbers when writing output to the panel, although the default built-in pattern ought to be sufficient in most cases.

The configuration file will be saved and automatically reloaded when closed.

## Settings
### Palette panel
The palette panel shows the configured command and output targets for each command. The visibility of these can be toggled in the settings.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/panel-settings.png?raw=true)

### Configure shell
Commands will be executed by the system's default shell, which is `sh` on OSX and Linux and `cmd.exe` on Windows.

If you would like to use a particular shell then you can specify it under Process Palette's settings. This shell will then be used when running any of the commands. Leave the value blank for the system default to be used.

## User Interface
### Process Palette Panel
Process Palette has a small panel that lists all the commands that are configured. It can be toggled by pressing `Ctrl-Alt-P` or from the menu `Packages|Process Palette|Toggle`.
From here one can see all the commands and also run them.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/panel-basic.png?raw=true)

Pressing the down arrow in the top right corner will hide the panel.

### Process Instances
Multiple instances of a process can run at a time. The process ID of each instance is shown on the right in the form of a button. Pressing the button will show that process' output. The process can be manually terminated by pressing the square stop button next to the process ID.

### Process Output Panel
If the command is configured to output to the Process Palette panel then clicking on the process ID button will cause the panel to switch to showing the output of that process.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/panel-output-basic.png?raw=true)

The other process instances will still be shown, but the selected one will be highlighted.

Scroll lock can be toggled with the lock button. Scroll lock will also enable when one starts to scroll or clicks on the output. It will automatically disable when one scrolls to the bottom.

The output can be cleared by pressing the trash can button.

From here one can return to the list by pressing the button in the top left corner.

### Notifications
Each time a process is executed a message will be shown in the top right hand corner. A successful execution with an exit status code of 0 will show a success message. Anything other than 0 will show a warning. What these messages display can be configured or even disabled completely as will be seen in the Advanced Configuration section.

## Tree View Integration
Commands can be run from the tree view with the selected file as input to the command. Any command that references any of the `{file*}` variables will be available.

To choose the command to run a file with, open the context menu on a file in the tree view and choose the command from the `Run With` sub menu.

See the [example](#tree_view_example) at the top.

## Command Palette
Command|Description
---|---
Hide|Hides the output panel.
Show|Shows the output panel.
Toggle|Toggles the output panel's visibility.
Edit Configuration|Opens graphical configuration editor.
Reload Configuration|Reloads all configuration files. This is only necessary if a process-palette.json file was directly modified with a text editor.
Rerun Last|Runs the last command that was executed again.
Kill Focused Process|Kills the process that is currently shown.
Kill And Remove Focused Process|Kill the process that is currently shown and removes its output.
Remove Focused Output|Removes the output that is currently shown, unless the process is still running.

## Configuration Files
The configuration files can also be edited by hand. The remainder of the document will describe how to do this.

Commands are specified with a configuration file in JSON format. The name of the file must be `process-palette.json` and should be in the root of your project folder. If you have multiple project folders, each with its own configuration file, then their configurations will be merged.

A `process-palette.json` file can also be placed in your `~/.atom` folder. If that is the case then it will be loaded first and any project specific files will be loaded afterwards.

### Basic Example
A `process-palette.json` configuration file contains an array called `commands`. The following is an example of an empty array:
```json
{
  "commands" : [
  ]
}
```
Each entry in the array is an object that describes one command. The most basic configuration simply specifies the command to run and associates it with an action. The following command will run [Ant](https://ant.apache.org/) without any arguments:
```json
{
  "commands" : [
    {
      "command" : "ant",
      "action"  : "Ant default"
    }
  ]
}
```

**Tip!** :
All `process-palette.json` configuration files can be reloaded by running the `Process Palette: Reload Configuration` command. It can be found in the `Command Palette` or in the `Packages|Process Palette` menu. There is also a reload button in the top right of the Process Palette panel.

The new command will cause an entry to be added to the command palette called `Process Palette: Ant default`.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/command-palette-basic.png?raw=true)

The working directory used when running a command is by default the project path, but it can also be configured. More on this in the Advanced Configuration section.

Command line arguments can also be specified in the form of an array of strings. The following example adds another command that causes the `clean` target to be executed by means of an argument:
```json
{
  "commands" : [
    {
      "action"  : "ant-default",
      "command" : "ant"
    },
    {
      "action"  : "ant-clean-artifacts",
      "command" : "ant clean"
    }
  ]
}
```


Reloading the configuration will cause the command palette to now have two new entries:
- Process Palette: Ant default
- Process Palette: Ant clean artifacts

The namespace used for all commands is by default `Process Palette`. This is also configurable. One must just be careful to not override commands in existing packages.

Let's modify the previous two commands to use a namespace call `Ant`:
```json
{
  "commands" : [
    {
      "namespace" : "ant",
      "action"    : "default",
      "command"   : "ant"
    },
    {
      "namespace" : "ant",
      "action"    : "clean-artifacts",
      "command"   : "ant clean",
    }
  ]
}
```
After reloading the configuration file the entries will be:
- Ant: Default
- Ant: Clean artifacts

### Shortcut Keys
Custom shortcut keys can also be associated with commands by adding a `keystroke` entry. Let's add the keystroke `Ctrl-Alt-A` to the `Ant: Default` command:
```json
{
  "namespace" : "ant",
  "action"    : "default",
  "command"   : "ant",
  "keystroke"  : "ctrl-alt-a"
}
```

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/command-palette-keystroke.png?raw=true)

After reloading the configuration the `Ant: Default` command can be run by pressing `Ctrl-Alt-A`.

## Advanced Configuration
The `namespace`, `action`, `command` and `keystroke` aren't the only properties that can be configured. Of these only the `action` and `command` are required. The rest are optional and have default values.

Many of the properties can be parameterized with variables from the environment. The following two sections describe the configurable properties and also the variables that can be used to parameterize them.

### Properties
Property|Description|Default
---|---|---
namespace|The namespace under which the command is categorized. This forms part of its identity in the Command Palette. It should be lowercase and words separated by hyphens. |"process-palette"
action (required)|The name of the action. This, together with the namespace, gives the command a unique identifier in the Command Palette.  It should be lowercase and words separated by hyphens.|null
command (required)|A string with the name and arguments of the command to execute.|null
arguments|An array of strings to pass as arguments to the command. Since v0.4.10 arguments can be added directly to the `command` property's value, however this approach can still be used.|[ ]
cwd|The working directory from which to execute the command. It doesn't have a default value, but one is automatically determined when the command is executed. If projects are open then the first project's folder is used. If there aren't any projects open then the folder of the `process-palette.json` file is used.|null
keystroke|A string describing the shortcut to associate with this command. It can be any combination of `ctrl`, `alt`, `shift` and `cmd` followed by another key separated with `-` characters.|null
promptToSave|Indicates whether the user should be prompted before any files are saved.|true
saveOption|Specify what should be saved. Either nothing, everything or only the files referenced by the command. Indicate with `none`, `all` and `referenced` respectively.|"none"
env|A map of environment variables. These will be made available in addition to the ones that are already defined in `process.env`|{ }
patterns|Array of pattern names to match.|["default"]
inputDialogs|Input dialogs to open in order to get input from the user which can then be used with variables.|[]

The following properties relate to the output produced by the process. The output can be redirected to a particular target. It can also be formatted depending on whether the process executed successfully or not. Giving any of the `xxxOutput` properties a value of `null` will prevent that output from being shown.

Property|Description|Default
---|---|---
outputTarget|Where the output produced by the process should be directed to. It can have one of the following  values: "panel", "terminal", "editor", "clipboard", "console" or "void". If the value is overridden with `null` then it will default to "void". More on this below.|"panel"
successOutput|The format of the output when the process returned with an exit status of 0.|"{stdout}"
errorOutput|The format of the output when the process returned with a non-0 exit status.|"{stdout}\n{stderr}"
fatalOutput|The format of the output when the command could not be executed at all.|"Failed to execute : {fullCommand}\n{stdout}\n{stderr}"
stream|Indicate whether the output should be streamed. If this is false then the output will be formatted and sent to the target only after the process completes. If it is true then the output, both standard and error, will be streamed to the target without any formatting applied.|false
autoShowOutput|If the panel should automatically be made visible when the process produces output. At the moment this only applies when `outputTarget` is set to `panel`.|true
autoHideOutput|If the panel should automatically be hidden when the process terminates. It will only be hidden if the process completes successfully and also only if the output is being viewed at the time of completion. This only applies when `outputTarget` is set to `panel`.|false
scrollLockEnabled|If scroll lock should automatically be enabled. This only applies when `outputTarget` is set to `panel`.|false
maxCompleted|The maximum number of completed processes whose output to keep at a time. It is used to automatically discard the oldest completed process in order to prevent them from piling up. This property only applies when the `outputTarget` is set to `panel`. It can be disabled by setting the value to `null` in which case all panels will have to be discarded manually.|3
outputBufferSize|The maximum number of characters to accumulate from standard output and error. When the buffer size is reached the oldest output is discarded. This is not applied to the output target, but only to the output accumulated in the `stdout` and `stderr` variables. This limit can be disabled by setting it to `null`, but should be done with caution for long running processes.|80000
singular|Set to `true` to terminate the running process before running a new instance.|false

The following properties relate to the messages shown before and after a command is executed. Giving any of the `xxxMessage` properties a value of `null` will prevent that message from being shown.

Property|Description|Default
---|---|---
startMessage|The format of the message before the process starts.|null
successMessage|The format of the message when the process returned with an exit status of 0.|"Executed : {fullCommand}"
errorMessage|The format of the message when the process returned with a non-0 exit status.|"Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}"
notifyOnStart|true if the start message should be shown.|false
notifyOnSuccess|true if the success message should be shown.|true
notifyOnError|true if the error message should be shown.|true

The following properties relate to custom JavaScript that can be executed before and after the process.

Property|Description|Default
---|---|---
startScript|Base-64 encoded JavaScript to run before the process starts.|null
successScript|Base-64 encoded JavaScript to run when the process returned with exit status of 0.|null
errorScript|Base-64 encoded JavaScript to run when the process returned with a non-0 exit status.|null
scriptOnStart|true if the start script should be run.|false
scriptOnSuccess|true if the success script should be run.|false
scriptOnError|true if the error script should be run.|false

### Output Targets
The `outputTarget` property specifies where the output produced by the process should be directed to. The following are valid targets:

Target|Description
---|---
void|The output will not be captured at all.
panel|The output will be shown in Process Palette's panel. Running a command that outputs to the panel will automatically open it if `autoShowOutput` is `true`.
clipboard|The output will be stored on the clipboard. Streaming to the clipboard is not supported. If `stream` is `true` when the output target is `clipboard` then streaming will be disabled.
editor|The output will be inserted into the open editor at the current cursor position. If an editor is not open the output is lost.
console|The output will be appended to the developer console.
file|The output will be written to a new file that will be opened in the Atom workspace.

The default value of `outputTarget` is "panel". If it is overridden with `null` then it will default to "void".

### Variables
Some of the properties can be parameterized with variables. Variables are added by enclosing the name of the variable in braces : `{` and `}`. The default values of some of the properties are already parameterized as can be seen in the tables above.

There are two types of variables : input and output. Input variables are available before the process executes and output variables are available after it has executed.

The following tables list the input and output variables:

**Input**

Variable|Description
---|---
clipboard | Text currently on clipboard.
fullCommand | The full command along with its arguments. Both the command and arguments will have their variables resolved.
configDirAbsPath | Absolute path of folder where the `process-palette.json` configuration file is that defines this command.
projectPath | If projects are open then the first project's folder will be used. If there aren't any projects open then the path of the folder containing the `process-palette.json` file is used.
selectProjectPath | Prompts to choose the path of one of the projects in the workspace.

**Input from editor**

The following input variables are only available if an editor is open. Their values default to an empty string otherwise.

Variable|Description
---|---
fileExt | Extension of file.
fileName | Name of file without extension.
fileNameExt | Name of file with extension.
filePath | Path of file relative to project.
fileDirPath | Path of file's directory relative to project.
fileAbsPath | Absolute path of file.
fileDirAbsPath | Absolute path of file's directory.
fileProjectPath | Absolute path of file's project folder.
selection | Currently selected text.
word | Word under cursor.
line | Line at cursor.
lineNo | Line number at cursor.
token | Token under the cursor according to the file's grammar.

**Input from user**

The `inputDialogs` property is an array of objects, each defining an input dialog that will be opened in order to take input from the user. Every dialog must specify the `variableName` that can then be used just like any other variable. Dialogs can be customized with a different `message` and `initialInput`.

Property|Description
---|---
name (required)|Name of the variable that can then be used in other properties.
message|Message to display with the input dialog.
initialInput|Initial text in the input dialog.

Here is an example of one such dialog:

```json
"inputDialogs" : [
    {
        "variableName": "userInput",
        "message": "Foo?",
        "initialInput": "Bar!"
    }
]
```

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/input-dialog.png?raw=true)

**Output**

These variables are only available after the process has executed. They can therefore typically be used in the output and message related properties.

Variable|Description
---|---
stdout | Standard output produced by the process.
stderr | Standard error output produced by the process.
exitStatus | Exit status code returned by the process.

### Applying Variables To Properties
The table below shows which properties support input variables and/or output variables:

Property|Input|Output
---|---|---
cwd|yes|no
env|yes|no
command|yes|no
arguments|yes|no
successOutput|yes|yes
errorOutput|yes|yes
fatalOutput|yes|yes
startMessage|yes|no
successMessage|yes|yes
errorMessage|yes|yes
startScript|yes|no
successScript|yes|yes
errorMessage|yes|yes

The `namespace`, `action` and `keystroke` properties do not support variables. The `env` property supports variables only in its values, for example :

```json
"env" : {
  "MYVAR" : "{fileName}"
}
```

A useful way of seeing the values of the variables is to add them to one of the output properties and then executing the command. For instance :

```json
"successOutput" : "File path : {filePath}\nProject path : {projectPath}"
```

will show the values of `filePath` and `projectPath` respectively.

Another way is to simply `echo` them as shown in the [example][2f6a8e37].

Keep in mind that the `arguments` property is an array of strings. Adding variables to arguments should therefore be done as such:

```json
"arguments" : ["{fileNameExt}", "{selection}"]
```
## Pipes
The value of a variable can be modified by piping it through a transform. The syntax is `{variable | transform}`

The following transforms are available:

Transform|Description
---|---
unix|Converts a Windows path to a unix path.
posix|The same as `unix`.
win|Converts a posix path to a Windows path.
trim|Trims whitespace.

### Converting File Paths
It may sometimes be necessary to convert a file path to use separators for a different platform. Any of the variables can be converted by piping it through a transform.

If, for instance, you are running on Linux and need to convert the `filePath` variable to a Windows style path, then you can specify it as `{filePath | win}`. The opposite can also be done with `{filePath | unix}` or `{filePath | posix}` when running on Windows.

## Detect Paths And Line Numbers
Commands that write to the output panel can be configured to detect file paths and optionally line numbers.

![Screenshot](https://github.com/morassman/process-palette/raw/master/resources/pattern.png?raw=true)

Detected paths will be underlined. Clicking it will open the file and if a line number is detected jump to it.

All commands will detect file paths by default. If line numbers are required then additional configuration is necessary.

### Patterns
Patterns are used to detect paths and line numbers. Process Palette has one built in pattern for detecting paths and all commands use this pattern by default.

Custom patterns can be added to the configuration file. Commands can then be configured to detect any of these patterns. The following example shows two custom patterns. The one pattern (P1) detects a path followed by a `:` and then the line number, whereas the other (P2) has whitespace between the path and line number.

```json
"patterns" : {
  "P1" : {
    "expression" : "(path):(line)"
    },
  "P2" : {
    "expression" : "(path)\\s+(line)"
  }
},
"commands" : [
  {
    "patterns" : ["P1", "P2"]
  }
]
```
Notice the following:
- `patterns` is an object and is defined on the same level as `commands`.
- Each pattern has a name. `P1` and `P2` in this case.
- Each pattern has a JS regular expression called `expression`.
- `(path)` and `(line)` are special placeholders. These are substituted with regular expressions for matching each respectively.
- Everything around `(path)` and `(line)` should be valid regular expressions.

With this configuration the command will be able to match `P1` and `P2` patterns. This overrides the default configuration that matches only paths. The built-in pattern for matching paths is called `default`. To match the default pattern as well, simply add it to the list:

```json
"patterns" : ["P1", "P2", "default"]
```

**Order matters!**
Patterns are evaluated in the order they are given. This means that if `default` was first in the list then it will be matched, but never any of the line numbers.

To disable pattern matching simply set the value of `patterns` to `null`.

### Custom Path Expression
In the previous example the `(path)` and `(line)` placeholders were used to quickly create an expression. In the background these are replaced with appropriate regular expressions. The `(path)` placeholder, in particular, will be replaced with an expression that is appropriate for the platform.

It may be that the built in expression is not sufficient for detecting paths in your command's output. If that is the case then you can overwrite it with your own. The following example shows how.

```json
"patterns" : {
  "P1" : {
    "expression" : "(path):(line)",
    "path" : "(?:\\/[\\w\\.\\-]+)+"
  }
}
```

In this case the given expression for `path` will be used instead.

**Important note about groups**<br>
Groups are enclosed in round brackets. `path` and `line` each forms a group and in this order they are at index 1 and 2 respectively. In this example the `path` expression is being overwritten, but this expression defines a group of its own. What's important to notice is the `?:` at the start of the group, which ensures that the group is not counted. The only groups that are allowed to be counted are for `path` and `line`, but neglecting to exclude other groups will interfere with their indexes.

## Callbacks To Custom JavaScript
You can specify your own JavaScript to run at certain stages of a process. Code can be specified to run before the process starts and after it has completed. Separate scripts can be specified based on whether the process completed successfully or failed.

Any of the input and output variables are available from within the scripts. Variables can be accessed simply by using its name, without the need to enclose it in braces. You also have access to Atom's API. For example:
```javascript
atom.workspace.open(fileProjectPath + '/my.file')
```

Environment variables can be accessed via a variable called `env`. For example:
```javascript
console.log(env['MY_ENV_VAR'])
```

These scripts are base-64 encoded. It is therefore advised to rather edit the scripts from the graphical editor instead of directly in the `process-palette.json` file, because then the script will be encoded automatically.

## Known Issues
### Background Processes
Process Palette considers its process to be completed only when all commands have finished executing. For instance, if a command is executed with an `&` appended then Process Palette will continue to handle the output produced by it until the child process spawned by that command exits.

This in itself is not a major problem. The issue is that Process Palette currently cannot kill child processes that are executed in this way. If the command executed with `&` opens a window then closing the window will allow the parent process to complete, but if it doesn't then one will have to kill the process by whatever means your OS allows.
