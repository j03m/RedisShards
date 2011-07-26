echo "\nInvoked with: "
echo $1
echo $2
export JAVA_HOME=/System/Library/Frameworks/JavaVM.framework/Versions/1.6/Home
export PATH=$JAVA_HOME/bin:/Users/jmordetsky/Downloads/rar/:/Users/jmordetsky/redis-2.2.2/src:$PATH
export NODE_PATH="/usr/local/lib/node"
export REDIS_CONF_PATH="/Users/jmordetsky"
redis-server "$REDIS_CONF_PATH/$1_$2/$1_$2.conf"
