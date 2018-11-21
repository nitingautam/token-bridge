nvm use v8.10.0

# fuser -k -n tcp 3000
npm run dev

# run outside docker
# nodemon --watch --exec "nyc mocha --compilers js:babel-core/register --require babel-polyfill tests/upload.test.js"

# bin bash

#generate documentation
#serverless openapi -o openapi$(date +%Y%m%d%H%M%S).yml  generate

# start docker machine first
# docker-machine start

# # build docker image with tag hara:dynamodb_local will be used on docker-compose
# docker build -t data:storage .

# # now run local env 
# docker-compose up