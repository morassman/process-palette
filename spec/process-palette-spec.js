/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ProcessPalette = require('../lib/main')

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe("ProcessPalette", function () {
  let [workspaceElement, activationPromise] = Array.from([])

  beforeEach(() => workspaceElement = atom.views.getView(atom.workspace))

  return describe("when the process-palette:toggle event is triggered", () => it("hides and shows the bottom panel", function () {
    // Before the activation event the view is not on the DOM, and no panel
    // has been created
    expect(workspaceElement.querySelector('.process-palette')).not.toExist()

    // Activate the package.
    activationPromise = atom.packages.activatePackage('process-palette')
    atom.commands.dispatch(workspaceElement, 'process-palette:toggle')

    waitsForPromise(() => activationPromise)

    return runs(function () {
      expect(workspaceElement.querySelector('.process-palette')).toExist()

      const processPaletteElement = workspaceElement.querySelector('.process-palette')
      expect(processPaletteElement).toExist()
      const processPalettePanel = atom.workspace.panelForItem(processPaletteElement)
      expect(processPalettePanel).toExist()

      const package = atom.packages.getActivePackage('process-palette')
      expect(package).toExist()

      const mainView = package.mainModule.mainView
      expect(mainView).toExist()

      expect(mainView.isVisible()).toBe(true)
      atom.commands.dispatch(workspaceElement, 'process-palette:toggle')
      return expect(mainView.isVisible()).toBe(false)
    })
  }))
})
