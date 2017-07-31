{$, View} = require 'atom-space-pen-views'
TableRowView = require './table-row-view'

module.exports =
class TableEditView extends View

  constructor: (@columns, @options = {}) ->
    @options.selectable ?= false
    @options.deletable  ?= false
    @options.draggable  ?= false

    # TODO: need selecting for dragging (for now), but dragging without selecting would drag a single element
    @options.selectable or= @options.draggable

    super(@columns, @options);
    @rowViews = [];

  @content: (columns, options) ->
    colWidth = 100 / columns.length;

    @div {class: 'process-palette-table-edit-view'}, =>
      @div {class: 'table-view'}, =>
        @table =>
          @colgroup =>
            if options.selectable
              @col {style:"width:0%"}
            if options.deletable
              @col {style:"width:0%"}
            for column in columns
              @col {style:"width:#{colWidth}%"}
          @thead =>
            @tr =>
              if options.selectable
                @th 'select', {class: 'text-highlight', style:"padding-right:1em"}
              if options.deletable
                @th 'delete', {class: 'text-highlight', style:"padding-right:1em"}
              for column in columns
                @th column, {class: 'text-highlight'}
          @tbody {outlet: 'tableBody'}
      @div {class: 'button-view drop-target'}, =>
        @button 'Add', {outlet: 'addButton', class: "btn btn-sm", click: 'addEmptyRow'}

  initialize: ->
    @addButton.on 'mousedown', (e) -> e.preventDefault();
    if @options.draggable
      @dragInit()

  reset: ->
    while @rowViews.length > 0
      @removeRowView(@rowViews[0]);

  addRow: (row) ->
    rowView = @addEmptyRow();
    rowView.setValues(row);

  addEmptyRow: ->
    rowView = new TableRowView(@, @getColumnCount());
    @tableBody.append(rowView);
    @rowViews.push(rowView);
    return rowView;

  removeRowView: (rowView) ->
    @rowViews.splice(@rowViews.indexOf(rowView), 1);
    rowView.remove();

  getRows: ->
    rows = [];
    for rowView in @rowViews
      rows.push(rowView.getValues());
    return rows;

  setRows: (rows) ->
    for rowView in @rowViews
      rowView.setValues(rows.shift());

  getColumnCount: ->
    return @columns.length;

  updateView: ->
    tableView = $(@).find(".table-view")
    if tableView.find(":checked").length
      tableView.addClass "items-selected"
    else
      tableView.removeClass "items-selected"

  dragInit: ->
    $(@).on "dragstart", (e) => @onDragStart? e
    $(@).on "dragend",   (e) => @onDragEnd?   e
    $(@).on "drag",      (e) => @onDrag?      e
    $(@).on "dragenter", (e) => @onDragEnter? e
    $(@).on "dragleave", (e) => @onDragLeave? e
    $(@).on "dragover",  (e) => @onDragOver?  e
    $(@).on "drop",      (e) => @onDrop?      e

  onDragStart: (e) ->
    #console.log ["onDragStart", e]
    #e.originalEvent.dataTransfer.setData("Text", e.target);
    # use empty 1px transparent image as drag image
    image = document.createElement('img')
    image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    xOffset = 0
    yOffset = 0
    e.originalEvent.dataTransfer.effectAllowed = "move"
    e.originalEvent.dataTransfer.dropEffect    = "move"
    e.originalEvent.dataTransfer.setDragImage(image, xOffset, yOffset)

  onDragEnd:   (e) ->
    #console.log ["onDragEnd",   e]
    target = @dropTarget(e)
    target.removeClass("current-drop-target")

  onDrag:      (e) ->
    #console.log ["onDrag",      e]

  onDragEnter: (e) ->
    target = @dropTarget(e)
    #console.log ["onDragEnter", e, target[0]]
    target.addClass("current-drop-target")

  onDragLeave: (e) ->
    target = @dropTarget(e)
    #console.log ["onDragLeave", e, target[0]]
    target.removeClass("current-drop-target")

  onDragOver:  (e) ->
    #console.log ["onDragOver",  e]
    target = @dropTarget(e)
    if target.length > 0
      #console.log ["drag over target found"]
      e.preventDefault()

  onDrop:  (e) ->
    #console.log ["onDrop",  e]
    target = @dropTarget(e)
    target.removeClass("current-drop-target")
    #console.log ["drop on", target]
    if target.length > 0
      #data = e.originalEvent.dataTransfer.getData("Text");
      #console.log ["drop target found"]
      e.preventDefault()
      @move(target[0])

  dropTarget: (e) ->
    return $(e.target).closest(".drop-target")

  move: (droppedBeforeElement) ->
    rows = []
    putaside = []

    # find droppedBeforeElement or set it at top (= already passed)
    insertionPointPassed = not droppedBeforeElement

    for rowView in @rowViews
      rowElement = rowView[0]
      selected = rowView.selected
      if selected
        rowView.select(false)

      if rowElement == droppedBeforeElement     # at insertion point
        insertionPointPassed = true
        for row in putaside                     #     add remembered rows
          rows.push(putaside.shift())

      if not insertionPointPassed               # up to insertion point
        if selected
          putaside.push(rowView.getValues())    #     remember selected rows
        else
          rows.push(rowView.getValues())        #     add other rows

      else                                      # from insertion point
        if selected
          rows.push(rowView.getValues())        #     add selected rows
        else
          putaside.push(rowView.getValues())    #     remember normal rows

                                                # after all
    for row in putaside                         #     add remembered rows
      rows.push(putaside.shift())
    @setRows rows                               #     save rows to table
