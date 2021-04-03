/** @babel */

const { File } = require('atom')

export function populateEditorFields(fields, editor) {
  if (editor) {
    const token = editor.tokenForBufferPosition(editor.getCursorBufferPosition())
    fields.text = editor.getText()
    fields.selection = editor.getSelectedText()
    fields.word = editor.getWordUnderCursor()
    fields.token = token ? token.value : ""

    const lastCursor = editor.getLastCursor()

    if (lastCursor != null) {
      fields.line = lastCursor.getCurrentBufferLine()
      fields.lineNo = `${lastCursor.getBufferRow() + 1}`
    } else {
      fields.line = '1'
      fields.lineNo = ''
    }
  } else {
    fields.text = ''
    fields.selection = ''
    fields.word = ''
    fields.token = ''
    fields.line = ''
    fields.lineNo = ''
  }
}

export function populateFilePathFields(fields, filePath) {
  if (filePath) {
    const file = new File(filePath)

    const nameExt = splitFileName(file.getBaseName())
    fields.fileName = nameExt[0]
    fields.fileExt = nameExt[1]

    fields.fileNameExt = file.getBaseName()
    fields.fileAbsPath = file.getRealPathSync()
    fields.fileDirAbsPath = file.getParent().getRealPathSync()

    let relPaths = atom.project.relativizePath(fields.fileAbsPath)
    fields.fileProjectPath = relPaths[0]
    fields.filePath = relPaths[1]

    relPaths = atom.project.relativizePath(fields.fileDirAbsPath)
    fields.fileDirPath = relPaths[1]
  } else {
    fields.fileName = ""
    fields.fileExt = ""
    fields.fileNameExt = ""
    fields.fileAbsPath = ""
    fields.fileDirAbsPath = ""
    fields.filePath = ""
    fields.fileDirPath = ""
    fields.fileProjectPath = ""
  }
}

export function getFieldsForTerminal() {
  const fields = {}

  const editor = atom.workspace.getActiveTextEditor()
  const projectPaths = atom.project.getPaths()

  fields.clipboard = atom.clipboard.read()

  if (projectPaths.length > 0) {
    fields.projectPath = projectPaths[0]
  }

  populateEditorFields(fields, editor)
  populateFilePathFields(fields, editor ? editor.getPath() : null)

  return fields
}

export function splitFileName(fileNameExt) {
  const index = fileNameExt.lastIndexOf(".")

  if (index === -1) {
    return [fileNameExt, ""]
  }

  return [fileNameExt.substr(0, index), fileNameExt.substr(index + 1)]
}
