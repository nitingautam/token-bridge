import AWS from "aws-sdk";
import { DataMapper } from '@aws/dynamodb-data-mapper';

const AWSregion = process.env.REGION ? process.env.REGION : "local";
export const AWSendpoint =
  process.env.DB_ENDPOINT !== 'undefined' && process.env.DB_ENDPOINT
    ? process.env.DB_ENDPOINT
    : "http://192.168.99.100:8000";

export const configDB = () => {
  let config = {
    region: AWSregion,
  }

  if(process.env.IS_DEV == "true") {
    config.region = 'local';
    config.accessKeyId = 'not-important';
    config.secretAccessKey = 'not-important';

    config = {
      ...config,
      endpoint: AWSendpoint,
      credentials: false,
    }
  }

  return config;
}

export const InitDB = () => {
  AWS.config.update(configDB());

  return new AWS.DynamoDB.DocumentClient();
};

const client = new AWS.DynamoDB(configDB());
export const Mapper = new DataMapper({client});

export const TB_WATCHER_BLOCKS = process.env.TB_WATCHER_BLOCKS ? process.env.TB_WATCHER_BLOCKS : "blockchain_watcher_blocks_dev";
export const TB_WATCHER = process.env.TB_WATCHER ? process.env.TB_WATCHER : "blockchain_watcher_dev";
