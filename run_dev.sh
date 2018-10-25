# bin bash

# start docker machine first
docker-machine start

# build docker image with tag hara:dynamodb_local will be used on docker-compose
docker build -t hara:token-bridge .

# now run local env 
docker-compose up