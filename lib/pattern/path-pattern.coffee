PathMatch = require './path-match'
UXRegExp = require 'uxregexp'

module.exports =
class PathPattern

  constructor: (@config) ->
    @uxre = new UXRegExp(@config.expression, @config.flags);

  match: (text) ->
    matches = @uxre.exec(text);

    if !matches?
      return null;

    try
      #console.log JSON.stringify([@config.name, @uxre.re.toString(), matches], null, "  ")
      match = matches.all
      pre = matches.pre
      post = matches.post
      path = matches.groups.path
      line = matches.groups.line
      #console.log ["path match:", JSON.stringify(path), JSON.stringify(line)]
      if line != null
        line = parseInt(line);

      return new PathMatch(text, match, pre, post, path, line);

    return null;
