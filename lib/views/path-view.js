/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PathView;
const {View} = require('atom-space-pen-views');
const PathUtil = require('path');
const fsp = require('fs-plus');

module.exports =
(PathView = class PathView extends View {

  constructor(cwd, pathPattern) {
    super(pathPattern);
    this.cwd = cwd;
    this.pathPattern = pathPattern;

  }

  static content(pathPattern) {
    return this.span(() => {
      return this.span(pathPattern.match, {class: "path-view", click: "clicked"});
  });
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

    return atom.workspace.open(path, options);
  }
});
