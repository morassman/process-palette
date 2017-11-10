{Directory} = require 'atom'
{SelectListView} = require 'atom-space-pen-views'

# This view is used as a modal for selecting one of the projects that are open in Atom.
module.exports =
class ProjectSelectView extends SelectListView

  constructor: (@callback, @path = true) ->
    super();

  initialize: ->
    super();

    @addClass('overlay from-top');
    items = @refreshItems();

    if items.length == 0
      return;

    if items.length == 1
      @openItem(items[0]);
      return;

    @setItems(items);

    @panel ?= atom.workspace.addModalPanel(item: this);
    @panel.show();
    @focusFilterEditor();

  refreshItems: ->
    items = [];

    for projectPath in atom.project.getPaths()
      dir = new Directory(projectPath);
      item = {};
      item.name = dir.getBaseName();
      item.path = projectPath;
      items.push(item);

    return items;

  getFilterKey: ->
    return "name";

  viewForItem: (item) ->
    return """
    <li class='two-lines'>
    <div class='primary-line'>#{item.name}</div>
    <div class='secondary-line'>#{item.path}</div>
    </li>"""

  openItem: (item) ->
    if !item?
      @callback(null);
    else if @path
      @callback(item.path);
    else
      @callback(item.name);

  confirmed: (item) ->
    @hide();
    @panel?.destroy();
    @openItem(item);

  cancelled: ->
    @hide();
    @panel?.destroy();
