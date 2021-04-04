/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const PathUtil = require('path')
const fsp = require('fs-plus')

export class PathView extends View {

  constructor(cwd, pathPattern) {
    super(false);
    this.cwd = cwd;
    this.pathPattern = pathPattern;
    this.initialize()
  }

  render() {
    return <span className="process-palette-path-view" on={{ click: () => this.clicked() }}>{this.pathPattern.match}</span>
  }

  pathExists() {
    return this.validatePath() !== null
  }

  validatePath() {
    let path = fsp.normalize(this.pathPattern.path);

    if (!fsp.isFileSync(path)) {
      path = PathUtil.join(this.cwd, this.pathPattern.path);
    }

    return fsp.isFileSync(path) ? path : null
  }

  clicked() {
    const path = this.validatePath()

    if (!path) {
      return
    }

    const options = {};

    if (this.pathPattern.line != null) {
      options.initialLine = this.pathPattern.line - 1;
    }

    atom.workspace.open(path, options)
  }
}

export function resolvePatternPath(cwd, patternPath) {
  let path = fsp.normalize(patternPath)

  if (!fsp.isFileSync(path)) {
    path = PathUtil.join(cwd, patternPath)
  }

  if (!fsp.isFileSync(path)) {
    return null
  }

  return path
}