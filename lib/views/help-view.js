/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { File } = require('atom');
const Path = require('path');
const View = require('./view')

export default class HelpView extends View {

  constructor({ main }) {
    super(true)
    this.main = main;
  }

  render() {
    const configFile = new File(atom.config.getUserConfigPath());
    const configFolder = configFile.getParent().getRealPathSync();

    return <div className="help" attributes={this.getAttributes()}>
      <h2 className="header">Process Palette</h2>
      <div className="content">
        <div>
          <span>Add commands by creating a </span>
          <span className="text-info">process-palette.json</span>
          <span> configuration file in any of the following locations:</span>
        </div>
        <ul>
          <li>
            <span>Your </span>
            <span className="text-info">{configFolder}</span>
            <span> folder for global commands </span>
            <button className="btn btn-sm inline-block-tight" ref="globalButton" on={{ click: this.createGlobalConfigurationFile, mousedown: (e) => e.preventDefault() }}>Do it!</button>
          </li>
          <li>
            <span>The root of any of your project folders for project specific commands </span>
            <button className="btn btn-sm inline-block-tight" ref="projectButton" on={{ click: this.createProjectConfigurationFile, mousedown: (e) => e.preventDefault() }}>
              Do it!
            </button>
          </li>
        </ul>
        <span>Once you've created a configuration file, run </span>
        <span className="btn btn-sm inline-block-tight" on={{ click: this.reloadConfiguration }}>Process Palette: Reload Configuration</span>
        <span>to load it.</span>
      </div>
    </div>
  }

  update(props, children) {
    return etch.update(this)
  }

  static content() {
    const configFile = new File(atom.config.getUserConfigPath());
    const configFolder = configFile.getParent().getRealPathSync();

    return this.div({ class: "help" }, () => {
      this.h2({ class: "header" }, 'Process Palette');
      return this.div({ class: "content" }, () => {
        this.div(() => {
          this.span("Add commands by creating a ");
          this.span("process-palette.json", { class: "text-info" });
          return this.span(" configuration file in any of the following locations:");
        });
        this.ul(() => {
          this.li(() => {
            this.span("Your ");
            this.span(`${configFolder}`, { class: "text-info" });
            this.span(" folder for global commands ");
            return this.button("Do it!", { class: 'btn btn-sm inline-block-tight', outlet: 'globalButton', click: 'createGlobalConfigurationFile' });
          });
          return this.li(() => {
            this.span("The root of any of your project folders for project specific commands ");
            return this.button("Do it!", { class: 'btn btn-sm inline-block-tight', outlet: 'projectButton', click: 'createProjectConfigurationFile' });
          });
        });
        this.span("Once you've created a configuration file, run ");
        this.span("Process Palette: Reload Configuration", { class: "btn btn-sm inline-block-tight", click: 'reloadConfiguration' });
        return this.span("to load it.");
      });
    });
  }

  createGlobalConfigurationFile() {
    const configFile = new File(atom.config.getUserConfigPath());
    this.main.guiEditConfiguration(true, '', configFile.getParent().getRealPathSync());
  }

  createProjectConfigurationFile() {
    this.main.editConfiguration(false);
  }

  createConfigurationFile(configFolder) {
    const configFile = configFolder.getFile("process-palette.json");

    if (!configFile.existsSync()) {
      const packagePath = atom.packages.getActivePackage('process-palette').path;
      const file = new File(Path.join(packagePath, 'examples', 'process-palette.json'));

      return file.read(false).then(content => {
        return configFile.create().then(() => {
          configFile.writeSync(content);
          return atom.workspace.open(configFile.getPath());
        });
      });
    } else {
      return atom.workspace.open(configFile.getPath());
    }
  }

  reloadConfiguration() {
    return this.main.reloadConfiguration();
  }

  serialize() { }

  destroy() {
    // return this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
