{File, Directory} = require 'atom'
{SelectListView} = require 'atom-space-pen-views'

module.exports =
class ConfigsView extends SelectListView

  constructor: (@main, @showGlobal = true) ->
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

    if @showGlobal
      configFile = new File(atom.config.getUserConfigPath());

      item = {};
      item.global = true;
      item.title = 'Global Configuration';
      item.projectName = '';
      item.path = configFile.getParent().getRealPathSync();
      items.push(item);

    for projectPath in atom.project.getPaths()
      dir = new Directory(projectPath);
      item = {};
      item.false = true;
      item.title = 'Project: '+dir.getBaseName();
      item.projectName = dir.getBaseName();
      item.path = projectPath;
      items.push(item);

    return items;

  getFilterKey: ->
    return "title";

  viewForItem: (item) ->
    return """
    <li class='two-lines'>
    <div class='primary-line'>#{item.title}</div>
    <div class='secondary-line'>#{item.path}</div>
    </li>"""

    # return "<li><span class='badge badge-info'>#{item.bookmark.name}</span> #{item.bookmark.path}</li>";

  openItem: (item) ->
    @main.guiEditConfiguration(item.global, item.projectName, item.path);

  confirmed: (item) ->
    @cancel();
    @openItem(item);

  cancelled: ->
    @hide();
    @panel?.destroy();
