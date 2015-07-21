ProcessConfig = require './process-config'
{BufferedProcess} = require 'atom'
{File} = require 'atom'

# Fields :
# stdout : Standard output.
# stderr : Standard error output.
# exitStatus : Code returned by command.
# projectAbsPath : Absolute path of project folder. - TODO
#
# Only if a file is currently open :
# fileExt : Extention of file. - TODO
# fileName : Name of file without extention. - TODO
# fileNameExt : Name of file with extention.
# filePath : Path of file relative to project. - TODO
# fileAbsPath : Absolute path of file.
# selection : Currently selected text.
# clipboard : Text currently on clipboard.

module.exports =
class ProcessController
  @config : null;
  @disposable : null;
  @process : null;

  constructor: (@config) ->
    console.log('ProcessController : '+@config.id);
    @replaceRegExp = new RegExp('{.*?}','g');
    @init();

  dispose: ->
    @disposable.dispose();

  init: ->
    console.log('init');
    commandName = @config.namespace+':'+@config.action;
    cssSelector = 'atom-workspace';

    if (@config.output.target == 'editor')
      cssSelector = 'atom-text-editor';
    else if (@config.output.target != 'clipboard')
      @config.output.target = 'console';

    commandCallback = (event) =>
      fields = {};
      fields.clipboard = atom.clipboard.read();
      fields.stdout = '';
      fields.stderr = '';
      fields.exitStatus = '';

      editor = atom.workspace.getActiveTextEditor();

      if (editor != null)
        file = new File(editor.getPath());
        fields.fileNameExt = file.getBaseName();
        fields.fileAbsPath = file.getRealPathSync();
        fields.selection = editor.getSelectedText();
      else
        fields.fileNameExt = '';
        fields.fileAbsPath = '';
        fields.selection = '';

      replaceCallback = @createReplaceCallback(fields);
      command = @config.command.replace(@replaceRegExp, replaceCallback);

      args = [];
      for argument in @config.arguments
        args.push(argument.replace(@replaceRegExp, replaceCallback));

      stdout = (output) ->
        fields.stdout = output;

      stderr = (output) ->
        fields.stderr = output;

      exit = (exitStatus) =>
        fields.exitStatus = exitStatus;
        @processExited(fields);

      @process = new BufferedProcess({command, args, stdout, stderr, exit});

    @disposable = atom.commands.add(cssSelector, commandName, commandCallback);

  createReplaceCallback: (fields) ->
    return (text) =>
      return fields[text.slice(1,-1)];

  processExited: (fields) ->
    console.log('processExited');

    replaceCallback = @createReplaceCallback(fields);
    formatted = @config.output.format.replace(@replaceRegExp, replaceCallback);
    editor = atom.workspace.getActiveTextEditor();

    if ((@config.output.target == 'editor') and (editor != null))
      editor.insertText(formatted);
    else if (@config.output.target == 'clipboard')
      atom.clipboard.write(formatted);
    else
      console.log(formatted);

    @process = null;
