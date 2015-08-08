ProcessConfig = require '../lib/process-config'

describe "ProcessConfig", ->
  it "will default outputTarget to panel if nothing is specified", ->
    config = new ProcessConfig();
    expect(config.outputTarget).toEqual "panel"

  it "will default outputTarget to void if overridden with invalid option", ->
    config1 = new ProcessConfig({outputTarget:null});
    config2 = new ProcessConfig({outputTarget:""});
    config3 = new ProcessConfig({outputTarget:"invalid"});

    expect(config1.outputTarget).toEqual "void"
    expect(config2.outputTarget).toEqual "void"
    expect(config3.outputTarget).toEqual "void"

  it "will not default outputTarget to void if overridden with valid option", ->
    config1 = new ProcessConfig({outputTarget:"panel"});
    config2 = new ProcessConfig({outputTarget:"editor"});
    config3 = new ProcessConfig({outputTarget:"clipboard"});
    config4 = new ProcessConfig({outputTarget:"console"});
    config5 = new ProcessConfig({outputTarget:"void"});

    expect(config1.outputTarget).toEqual "panel"
    expect(config2.outputTarget).toEqual "editor"
    expect(config3.outputTarget).toEqual "clipboard"
    expect(config4.outputTarget).toEqual "console"
    expect(config5.outputTarget).toEqual "void"

  it "will default arguments to [] when overridden with null", ->
    config = new ProcessConfig({arguments:null});

    expect(config.arguments).not.toBe null;
    expect(config.arguments).toEqual [];

  it "will correctly construct the full command with arguments", ->
    config1 = new ProcessConfig({command:"com1", arguments:null});
    config2 = new ProcessConfig({command:"com2", arguments:[]});
    config3 = new ProcessConfig({command:"com3", arguments:["arg0"]});
    config4 = new ProcessConfig({command:"com3", arguments:["arg0", "arg1"]});

    expect(config1.getFullCommand()).toEqual "com1"
    expect(config2.getFullCommand()).toEqual "com2"
    expect(config3.getFullCommand()).toEqual "com3 arg0"
    expect(config4.getFullCommand()).toEqual "com3 arg0 arg1"
