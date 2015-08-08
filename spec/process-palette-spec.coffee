ProcessPalette = require '../lib/main'

# Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
#
# To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
# or `fdescribe`). Remove the `f` to unfocus the block.

describe "ProcessPalette", ->
  [workspaceElement, activationPromise] = []

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)

  describe "when the process-palette:toggle event is triggered", ->
    it "hides and shows the bottom panel", ->
      # Before the activation event the view is not on the DOM, and no panel
      # has been created
      expect(workspaceElement.querySelector('.process-palette')).not.toExist()

      # Activate the package.
      activationPromise = atom.packages.activatePackage('process-palette')
      atom.commands.dispatch workspaceElement, 'process-palette:toggle'

      waitsForPromise ->
        activationPromise

      runs ->
        expect(workspaceElement.querySelector('.process-palette')).toExist()

        processPaletteElement = workspaceElement.querySelector('.process-palette')
        expect(processPaletteElement).toExist()

        processPalettePanel = atom.workspace.panelForItem(processPaletteElement)
        expect(processPalettePanel.isVisible()).toBe true
        atom.commands.dispatch workspaceElement, 'process-palette:toggle'
        expect(processPalettePanel.isVisible()).toBe false
