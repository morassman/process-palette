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
      if matches.length > 1
        ## we have found at least one group, use it as match
        #console.log(["match1", matches])
        match = matches[1]
        # this is a workaround, not absolutely correct!
        # javascript does not have index of a regex group
        # so find matched group in complete match and add offset
        # this does not work if the group string occurs multiple times in matches[0]
        # and the regex does not select the first occurance (e.g. might be anchored at $)
        start = matches.index + matches[0].indexOf(match)
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
