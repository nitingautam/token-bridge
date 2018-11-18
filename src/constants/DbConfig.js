import AWS from "aws-sdk";
import { DataMapper } from '@aws/dynamodb-data-mapper';

const AWSaccesssKeyId = process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID : "not-important";
const AWSsecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY : "not-important";
const AWSregion = process.env.REGION ? process.env.REGION : "local";
const AWSendpoint = process.env.AWS_ENDPOINT ? process.env.AWS_ENDPOINT : "http://localhost:8000";

const config = {
  accessKeyId: typeof AWSaccesssKeyId !== "undefined" ? AWSaccesssKeyId : "not-important",
  secretAccessKey: typeof AWSsecretAccessKey !== "undefined" ? AWSsecretAccessKey : "not-important",
  region: typeof AWSregion !== "undefined" ? AWSregion : "local",
  endpoint: typeof AWSendpoint !== "undefined" ? AWSendpoint : "http://localhost:8000",
  credentials: false,
}

export const InitDB = () => {
  AWS.config.update(config);
  return new AWS.DynamoDB.DocumentClient();
};

const client = new AWS.DynamoDB(config);
export const Mapper = new DataMapper({client});

export const TB_UPLOAD = process.env.TB_UPLOAD ? process.env.TB_UPLOAD : "upload_dev";
export const TB_UPLOAD_COUNTER = process.env.TB_UPLOAD_COUNTER ? process.env.TB_UPLOAD_COUNTER : "upload_counter_dev";
export const TB_UPLOADER_NAME = process.env.TB_UPLOADER_NAME ? process.env.TB_UPLOADER_NAME : "uploader_name_dev";
