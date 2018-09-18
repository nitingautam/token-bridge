nvm use v8.10.0
# npm install
npm link nyc
npm link mocha

mkdir dynamodb_data
eval "$(docker-machine env default)"
docker-machine start default
# docker build -t watcher:dev .
docker-compose --file docker_compose_test.yml up -d
# sls dynamodb install
sls dynamodb start -p 8000 --migrate true --dbPath=$(pwd)/dynamodb_data
sls offline --host 0.0.0.0 start -r ap-southeast-1 --noTimeout --location .webpack/service

# run this inside watcher:dev 
# serverless offline --skipCacheInvalidation --host 0.0.0.0 start -r ap-southeast-1 --noTimeout

# run inside docker
# nodemon --legacy-watch --exec "nyc mocha --compilers js:babel-register tests/mint.test.js"

# run outside docker
# nodemon --watch --exec "nyc mocha --compilers js:babel-register tests/mint.test.js"