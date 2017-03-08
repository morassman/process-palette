{View} = require 'atom-space-pen-views'
PathUtil = require 'path'
fsp = require 'fs-plus'

module.exports =
class PathView extends View

  constructor: (@cwd, @pathMatch) ->
    super(@pathMatch);

  @content: (pathMatch) ->
    @span =>
      @span pathMatch.match, {class: "process-palette-path-view", click: "clicked"}

  clicked: ->
    path = fsp.normalize(@pathMatch.path);

    if !fsp.isFileSync(path)
      path = PathUtil.join(@cwd, @pathMatch.path);

    if !fsp.isFileSync(path)
      return;

    options = {};

    if @pathMatch.line?
      options.initialLine = @pathMatch.line - 1;

    atom.workspace.open(path, options);
