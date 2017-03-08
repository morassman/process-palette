PathMatch = require './path-match'

module.exports =
class PathPattern

  constructor: (@config) ->
    @regex = new RegExp(@config.expression, @config.flags);

  match: (text) ->
    m = @regex.exec(text);

    if !m?
      return null;

    try
      match = m[0];
      path = m[@config.pathIndex];

      pre = text.substring(0, m.index);
      post = text.substring(m.index+m[0].length);
      line = null;

      if @config.lineIndex?
        line = parseInt(m[@config.lineIndex]);

      return new PathMatch(text, match, pre, post, path, line);

    return null;
