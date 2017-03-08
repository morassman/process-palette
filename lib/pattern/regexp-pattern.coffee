RegExpMatch = require './regexp-match'

module.exports =
class RegExpPattern

  constructor: (@config) ->
    @regex = new RegExp(@config.expression, @config.flags);

  match: (text) ->
    m = @regex.exec(text);

    if !m?
      return null;

    try
      match = m[0];
      pre = text.substring(0, m.index);
      post = text.substring(m.index+m[0].length);
      return new RegExpMatch(text, match, pre, post);

    return null;
