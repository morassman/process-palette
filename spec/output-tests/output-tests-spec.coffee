ProcessPalette = require '../../lib/main'
fs = require 'fs-plus'

#console.log fs.getHomeDirectory()
#console.log fs.getAppDataDirectory()

#test_base = "./spec/output-tests"
test_base = __dirname
test_project = test_base
test_namespace = 'process-palette-test'
test_action = 'cat-test'
re_test_file = /^test-/
re_extract_expect = /[\s\S]*\n+EXPECT:\n+/m
re_extract_output = /(<br>|\n)+EXPECT:(<br>|\n)+[\s\S]*/m

#console.log("test_base = " + test_base)

cleanup_html = (text) ->
  text = text.replace /<br>/g, "\n"
  text = text.replace /(\s)+$/g, ""
  text = text.replace /\n{2,}/mg, "\n"
  return "\n" + text + "\n"

for file in fs.readdirSync(test_base)

  #console.log(file)
  #continue

  path = test_base + "/" + file

  if file.match(re_test_file)

    #console.log(file)
    #continue

    workspaceElement = null

    beforeEach ->
      workspaceElement = atom.views.getView(atom.workspace)

    describe "output test in " + path, ->
      test_name = file.replace(re_test_file, "")
      test_file = path

      #console.log("test_file = " + test_file)

      it "runs", ->
        expected_output = new String(fs.readFileSync(test_file))
        #console.log "\n-----\n" + expected_output + "\n-----\n"
        expected_output = expected_output.replace(re_extract_expect, "")
        expected_output = expected_output.replace /^\#.*$/mg, ""
        expected_output = cleanup_html(expected_output)
        #console.log "\n=====\n" + expected_output + "\n=====\n"

        activationPromise = atom.packages.activatePackage('process-palette')
        atom.commands.dispatch(workspaceElement, 'process-palette:toggle')

        waitsForPromise ->
          activationPromise

        runs ->
          atom.project.setPaths([test_project])

        projectCtrl = null
        waitsFor 'project to be loaded', ->
          projectCtrl = ProcessPalette.getProjectControllerWithPath(test_project)

        configCtrl = null
        waitsFor 'config to be loaded', ->
          configCtrl = projectCtrl.getConfigController(test_namespace, test_action)

        processPaletteElement = null
        waitsFor 'config to be loaded', ->
          processPaletteElement = workspaceElement.querySelector('.process-palette')

        runs ->
          expect(expected_output.length).not.toEqual(0)
          expect(projectCtrl).not.toBe(null)
          expect(projectCtrl.getProjectPath()).toBe(test_project);
          expect(projectCtrl.configControllers.length).toBeGreaterThan(0)
          expect(configCtrl).not.toBe(null)
          expect(processPaletteElement).toExist()

          configCtrl.runProcessWithFile(test_file)

        outputPanelElement = null
        waitsFor 'output panel to be created', 1000, ->
          outputPanelElement = workspaceElement.querySelector('.process-palette-output-panel');

        waitsFor "EXPECT: in output", 1000, ->
          #console.log outputPanelElement.textContent
          outputPanelElement.innerHTML.includes "EXPECT:"

        runs ->
          html = outputPanelElement.innerHTML
          html = html.replace(re_extract_output, "")
          html = cleanup_html(html)
          expect(html).toEqual(expected_output)
