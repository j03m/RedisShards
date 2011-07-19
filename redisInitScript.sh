echo "Params:"
echo $1
echo $2

if [ -f '$2' ]; then
        echo 'File exists'; rm $2;
else
        echo 'File does not exist';
        if [ -d $1 ]; then
                echo 'Directory exists'
        else
                echo 'Directory does not exist'; mkdir $1;
        fi
fi
