
console.log "---------- hello"

console.log ['a', 'b'].isinstanceof Array

if 0
  text = "foo abc test 123 test xyz bar"
  re = /(abc.*?)(\d+)(.*xyz)/
  console.log text.match re

if 0
  text = "foo abc test 123 test xyz bar"
  re = /abc.*?(\d+).*xyz/
  console.log text.match re

if 0    # remove value from array
  a = ["1","2","3"]
  a.splice a.indexOf("2"), 1
  console.log a

if 0    # get jquery version used in space-pen

  {$, $$} = require 'atom-space-pen-views'
  console.log $.fn.jquery

if 0    # regexp

  re = ""
  re += "(?:\n\\bfile:?\\s+|\n\\bsource:?\\s+|\n\\bat:?\\s+\n)?"
  re += "['\"]?([-\\w/+.]+)['\"]?\n"
  re += "\\s*[(](\\d+)[)]"
  re = re.replace(/\n/g, "")

  console.log re

  re = new RegExp(re)

  text = "xxx ../output-tests/test-multiple-paths.txt (4) yyy"

  matches = re.exec(text)

  console.log matches
