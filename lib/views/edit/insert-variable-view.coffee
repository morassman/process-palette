{SelectListView} = require 'atom-space-pen-views'

module.exports =
class InsertVariableView extends SelectListView

  constructor: (@editor, @showOutputVariables=false, @addBraces=true) ->
    super();

  initialize: ->
    super();

    @addClass('overlay from-top');
    @refreshItems();

    @panel ?= atom.workspace.addModalPanel(item: this);
    @panel.show();
    @focusFilterEditor();

  refreshItems: ->
    items = [];

    if @showOutputVariables
      items.push({name:'stdout',description:'Standard output produced by the process.'});
      items.push({name:'stderr',description:'Standard error output produced by the process.'});
      items.push({name:'exitStatus',description:'Exit status code returned by the process.'});

    items.push({name:'fileExt',description:'Extension of file.'});
    items.push({name:'fileName',description:'Name of file without extension.'});
    items.push({name:'fileNameExt',description:'Name of file with extension.'});
    items.push({name:'filePath',description:'Path of file relative to project.'});
    items.push({name:'fileDirPath',description:'Path of file\'s directory relative to project.'});
    items.push({name:'fileAbsPath',description:'Absolute path of file.'});
    items.push({name:'fileDirAbsPath',description:'Absolute path of file\'s directory.'});
    items.push({name:'fileProjectPath',description:'Absolute path of file\'s project folder.'});

    items.push({name:'text',description:'The full contents of the editor.'});
    items.push({name:'clipboard',description:'Text currently on clipboard.'});
    items.push({name:'selection',description:'Currently selected text.'});
    items.push({name:'word',description:'Word under cursor.'});
    items.push({name:'token',description:'Token under cursor.'});
    items.push({name:'line',description:'Line at cursor.'});
    items.push({name:'lineNo',description:'Line number at cursor.'});
    items.push({name:'fullCommand',description:'The full command along with its arguments.'});
    items.push({name:'projectPath',description:'Path of the first project\'s folder.'});
    items.push({name:'selectProjectPath',description:'Prompts to choose the path of one of the projects in the workspace.'});
    items.push({name:'configDirAbsPath',description:'Absolute path of folder where the configuration file is that defines this command.'});

    @setItems(items);

  getFilterKey: ->
    return "name";

  viewForItem: (item) ->
    return """
    <li class='two-lines'>
    <div class='primary-line'>#{item.name}</div>
    <div class='secondary-line'>#{item.description}</div>
    </li>"""

  confirmed: (item) ->
    @cancel();

    text = item.name;

    if @addBraces
      text = "{" + text + "}";

    @editor.getModel().insertText(text);
    @editor.focus();

  cancelled: ->
    @hide();
    @panel?.destroy();
