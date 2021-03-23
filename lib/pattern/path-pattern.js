/** @babel */

export default class PathPattern {

  constructor(text, match, path, line, pre, post) {
    this.text = text;
    this.match = match;
    this.path = path;
    this.line = line;
    this.pre = pre;
    this.post = post;
  }

}
