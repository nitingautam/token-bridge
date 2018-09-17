import AWS from "aws-sdk";
import { DataMapper } from '@aws/dynamodb-data-mapper';

const AWSaccesssKeyId = "not-important";
const AWSsecretAccessKey = "not-important";
const AWSregion = process.env.REGION ? process.env.REGION : "local";
const AWSendpoint = "http://localhost:8000";

export const configDB = () => {
  let config = {
    accessKeyId: AWSaccesssKeyId,
    secretAccessKey: AWSsecretAccessKey,
    region: AWSregion,
  }

  if(process.env.IS_DEV) {
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

export const TB_CONTRACT_DETAILS = process.env.TB_CONTRACT_DETAILS ? process.env.TB_CONTRACT_DETAILS : "contract_details_dev" ;
export const TB_WATCHER_BLOCKS = process.env.TB_WATCHER_BLOCKS ? process.env.TB_WATCHER_BLOCKS : "blockchain_watcher_blocks_dev";
export const TB_WATCHER = process.env.TB_WATCHER ? process.env.TB_WATCHER : "blockchain_watcher_dev";
