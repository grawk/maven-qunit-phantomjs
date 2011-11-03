hash phantomjs 2>&- || { echo >&2 "I require phantomjs but it's not installed.  Aborting."; exit 0; }
echo $1
phantomjs $1 $2 $3