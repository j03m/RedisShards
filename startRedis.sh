echo "Invoked with: "
echo $1
echo $2
redis-server "$REDIS_CONF_PATH/$1_$2/$1_$2.conf"
