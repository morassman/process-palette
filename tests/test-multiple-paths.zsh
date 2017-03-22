

# line 3
# line 4
# line 5

# test if multiple paths are detected in one line
# also line matches (starting with dashes or exclamation)
# also single words (*error*)

# this works because paths are detected first
# then inline patterns are applied to surrounding strings
# at last line patterns are applied to the complete line

# use with
#
# "error": {
#   "expression": "[-\\w]*error[-\\w]*"
# },
# "dashes": {
#   "expression": "^\\s*--"
# },
# "exclamation": {
#   "expression": "^\\s*!"
# },

echo "  -- blafusel ./test-multiple-paths.zsh:3 hurzmiburz /not/a/real/file ../tests/test-multiple-paths.zsh:4 SomeErrorHorror foo test-multiple-paths.zsh:5 Test-Error bar"
echo "   ! blafusel more-errors ./test-multiple-paths.zsh:3 hurzmiburz Another_Error ../tests/test-multiple-paths.zsh:4 foo test-multiple-paths.zsh:5 bar"
