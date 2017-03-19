

# line 3
# line 4
# line 5

# test if multiple paths are detected in one line
# also line matches (starting with dashes or exclamation)
# also single words (*error*)

# this works because paths are detected first
# then inline patterns are applied to surrounding strings
# after all line patterns are applied to the complete line (but with sub-expressions replaced)

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

echo "  -- blafusel ./test-multi-path.zsh:3 hurzmiburz /not/a/real/file ../tests/test-multi-path.zsh:4 SomeErrorHorror foo test-multi-path.zsh:5 Test-Error bar"
echo "   ! blafusel more-errors ./test-multi-path.zsh:3 hurzmiburz Another_Error ../tests/test-multi-path.zsh:4 foo test-multi-path.zsh:5 bar"
