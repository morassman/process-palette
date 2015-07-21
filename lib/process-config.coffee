module.exports =
class ProcessConfig

  constructor: (object={}) ->
    console.log('ProcessConfig');
    @namespace = 'Process Palette';
    @arguments = [];
    @output = {
      target : 'console',
      format : '{stdout}'
    };

    for key, val of object
      @[key] = val
