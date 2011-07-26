echo "Invoked with: "
echo $1
echo $2
echo $3
export JAVA_HOME=/System/Library/Frameworks/JavaVM.framework/Versions/1.6/Home
export PATH=$JAVA_HOME/bin:/Users/jmordetsky/Downloads/rar/:/Users/jmordetsky/redis-2.2.2/src:$PATH
redis-cli -h $1 -p $2 $3
