

echo "Invoked with: "
echo $1
echo $2
redis-cli -h $1 -p $2 SHUTDOWN