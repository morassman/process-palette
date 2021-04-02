/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const PathUtil = require('path');
const fsp = require('fs-plus');

export default class PathView extends View {

  constructor(cwd, pathPattern) {
    super(false);
    this.cwd = cwd;
    this.pathPattern = pathPattern;
    this.initialize()
  }

  render() {
    return <span className="process-palette-path-view" on={{ click: () => this.clicked() }}>{this.pathPattern.match}</span>
  }

  clicked() {
    let path = fsp.normalize(this.pathPattern.path);

    if (!fsp.isFileSync(path)) {
      path = PathUtil.join(this.cwd, this.pathPattern.path);
    }

    if (!fsp.isFileSync(path)) {
      return;
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