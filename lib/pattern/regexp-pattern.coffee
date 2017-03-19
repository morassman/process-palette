RegExpMatch = require './regexp-match'

module.exports =
class RegExpPattern

  constructor: (@config) ->
    @regex = new RegExp(@config.expression, @config.flags);

  match: (text) ->
    matches = @regex.exec(text);

    if !matches?
      return null;

    try
      #console.log(["matches", matches])
      if matches.length == 4 and (matches[1].length + matches[2].length + matches[3].length == text.length)
        ## we have a special pattern with three groups for pre, match, post
        # (note: three groups are necessary, because javascript does not have index of a group matches)
        #console.log(["matches3", matches])
        pre = matches[1]
        match = matches[2]
        post = matches[3]
      else
        ## no group, use complete match
        match = matches[0]
        start = matches.index
        end = start + match.length
        pre = text.substring(0, start);
        post = text.substring(end);
      #console.log(["pre/match/post", pre, match, post])
      return new RegExpMatch(text, match, pre, post);

    return null;
