echo "  -- blafusel ./test-multiple-paths.zsh:3 hurzmiburz /not/a/real/file-txt ../tests/test-multiple-paths.zsh:4 SomeErrorHorror foo test-multiple-paths.zsh:5 Test-Error bar"
echo "  -- blafusel more-errors ./test-multiple-paths.zsh:3 hurzmiburz Another_Error ../tests/test-multiple-paths.zsh:4 foo test-multiple-paths.zsh:5 bar"
echo "  -- blafusel more-errors \"./test-multiple-paths.zsh\" hurzmiburz Another_Error '../tests/test-multiple-paths.zsh' foo \"test-multiple-paths.zsh' bar"

# does not work: file is used as prefix in "file (path) ((line))"
echo "ERROR /not/a/real/file test-multiple-paths.zsh (5)"
