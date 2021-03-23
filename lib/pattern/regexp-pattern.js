/** @babel */

const PathPattern = require('./path-pattern');

export default class RegExpPattern {

  constructor(config) {
    this.config = config;
    this.regex = new RegExp(this.config.expression, this.config.flags);
  }

  match(text) {
    const m = this.regex.exec(text);

    if ((m == null)) {
      return null;
    }

    try {
      const match = m[0];
      const path = m[this.config.pathIndex];

      const pre = text.substring(0, m.index);
      const post = text.substring(m.index+m[0].length);
      let line = null;

      if (this.config.lineIndex != null) {
        line = parseInt(m[this.config.lineIndex]);
      }

      return new PathPattern(text, match, path, line, pre, post);
    } catch (error) {}

    return null;
  }

}
