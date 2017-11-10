{View} = require 'atom-space-pen-views'
PathUtil = require 'path'
fsp = require 'fs-plus'

module.exports =
class PathView extends View

  constructor: (@cwd, @pathPattern) ->
    super(@pathPattern);

  @content: (pathPattern) ->
    @span =>
      @span pathPattern.match, {class: "path-view", click: "clicked"}

  clicked: ->
    path = fsp.normalize(@pathPattern.path);

    if !fsp.isFileSync(path)
      path = PathUtil.join(@cwd, @pathPattern.path);

    if !fsp.isFileSync(path)
      return;

    options = {};

    if @pathPattern.line?
      options.initialLine = @pathPattern.line - 1;

    atom.workspace.open(path, options);
