/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ProcessConfig = require('../lib/process-config');

describe("ProcessConfig", function() {
  it("will default outputTarget to panel if nothing is specified", function() {
    const config = new ProcessConfig();
    return expect(config.outputTarget).toEqual("panel");
  });

  it("will default outputTarget to void if overridden with invalid option", function() {
    const config1 = new ProcessConfig({outputTarget:null});
    const config2 = new ProcessConfig({outputTarget:""});
    const config3 = new ProcessConfig({outputTarget:"invalid"});

    expect(config1.outputTarget).toEqual("void");
    expect(config2.outputTarget).toEqual("void");
    return expect(config3.outputTarget).toEqual("void");
  });

  it("will not default outputTarget to void if overridden with valid option", function() {
    const config1 = new ProcessConfig({outputTarget:"panel"});
    const config2 = new ProcessConfig({outputTarget:"editor"});
    const config3 = new ProcessConfig({outputTarget:"clipboard"});
    const config4 = new ProcessConfig({outputTarget:"console"});
    const config5 = new ProcessConfig({outputTarget:"void"});

    expect(config1.outputTarget).toEqual("panel");
    expect(config2.outputTarget).toEqual("editor");
    expect(config3.outputTarget).toEqual("clipboard");
    expect(config4.outputTarget).toEqual("console");
    return expect(config5.outputTarget).toEqual("void");
  });

  it("will default arguments to [] when overridden with null", function() {
    const config = new ProcessConfig({arguments:null});

    expect(config.arguments).not.toBe(null);
    return expect(config.arguments).toEqual([]);
  });

  return it("will correctly construct the full command with arguments", function() {
    const config1 = new ProcessConfig({command:"com1", arguments:null});
    const config2 = new ProcessConfig({command:"com2", arguments:[]});
    const config3 = new ProcessConfig({command:"com3", arguments:["arg0"]});
    const config4 = new ProcessConfig({command:"com3", arguments:["arg0", "arg1"]});

    expect(config1.getFullCommand()).toEqual("com1");
    expect(config2.getFullCommand()).toEqual("com2");
    expect(config3.getFullCommand()).toEqual("com3 arg0");
    return expect(config4.getFullCommand()).toEqual("com3 arg0 arg1");
  });
});
