FROM lambci/lambda:build-nodejs8.10
LABEL maintainer="Allandhino pattras <allandhino.pattras@hara.ag>"

# Add package.json before rest of repo for caching
ADD package.json /app/
WORKDIR /app
RUN npm install

ADD . /app

RUN npm link serverless
RUN npm link nodemon