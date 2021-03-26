/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { File } = require('atom');
const Path = require('path');
const View = require('./view')
const MainButtonsView = require('./main-buttons-view')

export default class HelpView extends View {

  constructor({ main, mainView }) {
    super(false)
    this.main = main;
    this.mainView = mainView
    this.initialize()
  }

  initialize() {
    super.initialize()
    this.refs.mainButtonsView.highlightHelpButton()
  }

  render() {
    const configFile = new File(atom.config.getUserConfigPath());
    const configFolder = configFile.getParent().getRealPathSync();

    return <div className="process-palette-help-view" attributes={this.getAttributes()}>
      <div className="process-palette-help-view-header">
        <div className="process-palette-help-view-header-left"></div>
        <h2 className="process-palette-help-view-header-center">Process Palette</h2>
        <div className="process-palette-help-view-header-right">
          <MainButtonsView ref="mainButtonsView" mainView={this.mainView} />
        </div>
      </div>
      <div className="process-palette-help-view-content">
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
            <button className="btn btn-sm inline-block-tight" ref="globalButton" on={{ click: () => this.createGlobalConfigurationFile(), mousedown: (e) => e.preventDefault() }}>Do it!</button>
          </li>
          <li>
            <span>The root of any of your project folders for project specific commands </span>
            <button className="btn btn-sm inline-block-tight" ref="projectButton" on={{ click: () => this.createProjectConfigurationFile(), mousedown: (e) => e.preventDefault() }}>
              Do it!
            </button>
          </li>
        </ul>
        <span>Once you've created a configuration file, run </span>
        <span className="btn btn-sm inline-block-tight" on={{ click: () => this.reloadConfiguration() }}>Process Palette: Reload Configuration</span>
        <span>to load it.</span>
      </div>
    </div>
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
