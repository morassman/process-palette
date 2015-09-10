module.exports =
class Buffer

  constructor: (@maxSize)->
    @size = 0;
    @array = [];

  push: (data) ->
    @size += data.length;
    @array.push(data);

    if !@maxSize?
      return;

    while @size > @maxSize
      diff = @size - @maxSize;

      if diff < @array[0].length
        @array[0] = @array[0].slice(diff);
        @size -= diff;
      else
        discard = @array.shift();
        @size -= discard.length;

  clear: ->
    @size = 0;
    @array = [];

  getLineCount: ->
    return @array.length;

  toString: ->
    return @array.join("");
