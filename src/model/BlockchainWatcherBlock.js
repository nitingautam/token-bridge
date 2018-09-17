import { InitDB, TB_WATCHER_BLOCKS } from "../constants/DbConfig";
import { promisify } from "util";

export default class BlockchainWatcherBlock {
  constructor() {
    this.tblName = TB_WATCHER_BLOCKS;

    this.ddb = InitDB();
    this.dynamoDBGetAsync = promisify(this.ddb.get).bind(this.ddb);
    this.dynamoDBUpdateAsync = promisify(this.ddb.update).bind(this.ddb);
    this.dynamoDBQueryAsync = promisify(this.ddb.query).bind(this.ddb);
    this.dynamoDBScanAsync = promisify(this.ddb.scan).bind(this.ddb);
    this.dynamoDBPutAsync = promisify(this.ddb.put).bind(this.ddb);
  }

  _getLatestBlock = async (networkID = "1") => {
    let params = {
      TableName: this.tblName,
      Key: {
        networkid: "1",
        event: "burn"
      }
    };

    if(networkID != "1") {
      params = {
        TableName: this.tblName,
        Key: {
          networkid: "2",
          event: "mint"
        }
      };
    }

    let result = await this.dynamoDBGetAsync(params);

    if (typeof result.Item === "undefined" && networkID == "1") {
      await this._initLatestBlock("1");
      return 1;
    } else if(typeof result.Item === "undefined" && networkID == "2") {
      await this._initLatestBlock("2");
      return 2;
    } else {
      return result.Item.latestBlock
    }
  };

  _initLatestBlock = async (networkID = "1") => {
    let params = {
      TableName: this.tblName,
      Item: {
        networkid: "1",
        event: "burn",
        latestBlock: 1
      }
    };

    if(networkID != "1") {
      params = {
        TableName: this.tblName,
        Item: {
          networkid: "2",
          event: "mint",
          latestBlock: 1
        }
      };
    }

    let result = await this.dynamoDBPutAsync(params);
  };
  
  _updateLatestBlock = async (networkID = "1", latestBlock= "1") => {
    let eventType = "burn";
    if(networkID == "2") {
      eventType = "mint";
    }

    var params = {
      TableName: this.tblName,
      Key: { networkid: networkID, event: eventType },
      UpdateExpression: "set latestBlock = :latestBlock",
      ExpressionAttributeValues: {
        ":latestBlock": latestBlock
      },
      ReturnValues: "UPDATED_NEW"
    };
    return await this.dynamoDBUpdateAsync(params);
  }
}
