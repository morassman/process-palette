
# use with
#
# line starting with \
#
# "trace-begin": {
#   "expression": "^\\s*\\\\\\s+"
# },
#
# line starting with \
#
# "trace-end": {
#   "expression": "^\\s*/\\s+"
# },
#
# line starting with / regex matches " = some content but not the last word"
#
# "trace-result": {
#   "expression": "(?:^\\s*/\\s+.*)(\\s+=\\s+.*)(?:\\s+\\w+)$"
# },
#
# also after the above sections an expression matching the fords fail, failed or failure
#
# "fail": {
#   "expression": "\\b(fail(ure|ed)?)\\b"
# },

echo "some unstyled text"
# should mark next two lines as .trace-begin
echo "   \ a ( x=1 y=2 z=3 )"
echo "     \ b ( x=6 )"
# should style the line as .trace-end
# also .trace-result starting with " = ", but not xxx
echo "     / b ( x=6 ) = 'converted to string: 6' xxx"
# should style the line as .trace-end
# no .trace-result because no word at end of line
#     (" 6'" is NOT a word, because "'" is not included in \w)
echo "   / a ( x=1 y=2 z=3 ) = 'converted to string: 6'"
echo "unstyled text inbetween"
# fictional case for multiple .trace-result " = result",
# because of the javascript workaround incorrectly only the first will be styled,
# but the regex is for the second = xxx
echo " / example = xxx = xxx zzz"
# here correctly " = yyy" is styled because both group matches differ
echo " / example = xxx = yyy zzz"
# " = yyy" is styled, but "failure" is not, because the pattern it is not
# applied to pre and post strings after detecting " = yyy"
# if the sequence is "fail, trace-result" instead,
#     then "failure" will be styled, but not " = yyy"
echo " / failure example = xxx = yyy zzz"
echo "some more unstyled text"
