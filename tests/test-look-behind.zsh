echo "some unstyled text"
# should style next two lines as .trace-begin
echo "   \ a ( x=1 y=2 z=3 )"
echo "     \ b ( x=6 )"
# should style next line as .trace-end and .trace-result starting with " = "
echo "     / b ( x=6 ) = 'converted to string: 6'"
# should style next line as .trace-end and .trace-result starting with " = "
echo "   / a ( x=1 y=2 z=3 ) = 'converted to string: 6'"
echo "unstyled text inbetween"
# fictional case for multiple .trace-result " = xxx", the second should be styled
echo " / example = xxx = xxx"
# " = yyy" should be styled
echo " / example = xxx = yyy"
# " = yyy" is styled, but "failure" is not, because the pattern it is not
# applied to pre and post strings after detecting " = yyy"
# if the sequence would be "fail, trace-result" instead,
#     then "failure" would be styled, but not " = yyy"
echo " / failure example = xxx = yyy"
echo "some more unstyled text"
