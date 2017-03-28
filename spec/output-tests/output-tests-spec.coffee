ProcessPalette = require '../../lib/main'
ProcessController = require '../../lib/controllers/process-controller'

fs = require 'fs-plus'

#console.log fs.getHomeDirectory()
#console.log fs.getAppDataDirectory()

# enable this to show output_lines in output view to visualize the resulting styling
# note, in styles.less you need corresponding styles for each used pattern name
# see examples/hg42/styles.less
use_output_visualization = 1

# two different ways to detect the end of the output
# both are currently disabled, because feeding the output view directly seems to work in sync
use_output_end_marker = 0
use_output_end_length = 0

#test_base = "./spec/output-tests"
test_base = __dirname
test_project = test_base
test_namespace = 'process-palette-test'
test_action = 'cat-test'
re_test_file = /^test-/
re_extract_expect = /[\s\S]*\n+EXPECT:\n+/m
re_extract_output = /(<br>|\n)+EXPECT:(<br>|\n)+[\s\S]*/m
if use_output_end_marker
  re_extract_result = /(<br>|\n)+ENDofTEST(<br>|\n)+[\s\S]*/m

#console.log("test_base = " + test_base)

cleanup_html = (text) ->
  text = text.replace /<br>/g, "\n"
  text = text.replace /(\s)+$/g, ""
  text = text.replace /\n{2,}/mg, "\n"
  return text

for file in fs.readdirSync(test_base)

  #console.log(file)
  #continue

  path = test_base + "/" + file

  if file.match(re_test_file)

    #continue if not file.match(/test-test/)

    #console.log(file)
    #continue

    workspaceElement = null
    #test_name = null
    #test_name = null
    #test_file = null

    beforeEach ->
      workspaceElement = atom.views.getView(atom.workspace)

    describe "test in " + path, ->

      #console.log("test_file = " + test_file)
      test_name = file.replace(re_test_file, "")
      test_name = test_name.replace(/\..*$/, "")
      test_file = path

      process.chdir(test_project)

      it "should produce expected output", ->
        text = new String(fs.readFileSync(test_file))

        output_lines = text
        #console.log "\n<-----\n" + output_lines + "\n<-----\n"
        output_lines = output_lines.replace(re_extract_output, "")
        output_lines = output_lines.replace /^\#.*$/mg, ""
        output_lines = cleanup_html(output_lines)
        if use_output_visualization
          console.log "\n\n\n<================================================================================ " + test_name + "\n" +
                      output_lines +
                      "\n<--------------------------------------------------------------------------------\n\n\n"

        expected_output = text
        #console.log "\n>-----\n" + expected_output + "\n>-----\n"
        expected_output = expected_output.replace(re_extract_expect, "")
        expected_output = expected_output.replace /^\#.*$/mg, ""
        expected_output = cleanup_html(expected_output)
        #console.log "\n>=====\n" + expected_output + "\n>=====\n"

        activationPromise = atom.packages.activatePackage('process-palette')
        atom.commands.dispatch(workspaceElement, 'process-palette:toggle')

        waitsForPromise ->
          activationPromise

        runs ->
          atom.project.setPaths([test_project])

        projectCtrl = null
        waitsFor 'project to be loaded', 1000, ->
          projectCtrl = ProcessPalette.getProjectControllerWithPath(test_project)

        configCtrl = null
        waitsFor 'config to be loaded', 1000, ->
          configCtrl = projectCtrl.getConfigController(test_namespace, test_action)

        processCtrl = null
        runs ->
          expect(configCtrl).not.toBe(null)
          expect(output_lines.length).not.toEqual(0)
          expect(expected_output.length).not.toEqual(0)
          expect(projectCtrl).not.toBe(null)
          expect(projectCtrl.getProjectPath()).toBe(test_project);
          expect(projectCtrl.configControllers.length).toBeGreaterThan(0)
          expect(configCtrl).not.toBe(null)

          #configCtrl.runProcessWithFile(test_file)

          processCtrl = new ProcessController(configCtrl, configCtrl.config)
          configCtrl.getMain().showProcessOutput(processCtrl)

          processCtrl.outputView.clearOutput()
          processCtrl.outputView.outputToPanel(output_lines)
          if use_output_end_marker
            processCtrl.outputView.outputToPanel("\nENDofTEST\n")

        outputPanelElement = null
        waitsFor 'output panel to be created', ->
          outputPanelElement = workspaceElement.querySelector('.process-palette-output-panel')

        html = ""
        if use_output_end_marker
          waitsFor "ENDofTEST in output", ->
            html = outputPanelElement.innerHTML
            html.includes "ENDofTEST"
        if use_output_end_length
          len0 = -1
          waitsFor "ENDofTEST in output", ->
            html = outputPanelElement.innerHTML
            len = html.length
            if len == len0
              return true
            len0 = len
            return false

        runs ->
          if use_output_end_marker
            html = html.replace(re_extract_result, "")
          if html == ""
            html = outputPanelElement.innerHTML
          html = cleanup_html(html)
          expect("\n" + html + "\n").toEqual("\n" + expected_output + "\n")
