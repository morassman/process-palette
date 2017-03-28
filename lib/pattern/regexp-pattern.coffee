RegExpMatch = require './regexp-match'
UXRegExp = require 'uxregexp'

module.exports =
class RegExpPattern

  constructor: (@config) ->
    @uxre = new UXRegExp(@config.expression, @config.flags);

  match: (text) ->
    matches = @uxre.exec(text);

    if !matches?
      return null;

    try
      #console.log("matches:\n" + JSON.stringify(matches, null, "  "))
      if matches.groups[1]
        idx = matches.infos[1].index
        len = matches.groups[1].length
        pre = matches.input[0...idx]
        match = matches.input[idx...idx+len]
        post = matches.input[idx+len..]
      else
        ## no group, use complete match
        match = matches.all
        pre = matches.pre
        post = matches.post
      #console.log(["pre/match/post", pre, match, post])
      return new RegExpMatch(text, match, pre, post);

    return null;
