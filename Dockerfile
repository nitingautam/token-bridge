FROM lambci/lambda:build-nodejs8.10
LABEL maintainer="Juwita Winadwiastuti <juwita.winadwiastuti@hara.ag>"
ADD . .
RUN npm install -g serverless@1.27.2 && \
    npm install
# RUN npm install -g webpack