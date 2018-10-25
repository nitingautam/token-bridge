import { InitDB, TB_WATCHER_BLOCKS } from "../constants/DbConfig";
import { promisify } from "util";

export default class BlockchainWatcherBlock {
  constructor() {
    this.tblName = TB_WATCHER_BLOCKS;

    console.log("BlockchainWatcherBlock", TB_WATCHER_BLOCKS);

    this.ddb = InitDB();
    this.dynamoDBGetAsync = promisify(this.ddb.get).bind(this.ddb);
    this.dynamoDBUpdateAsync = promisify(this.ddb.update).bind(this.ddb);
    this.dynamoDBQueryAsync = promisify(this.ddb.query).bind(this.ddb);
    this.dynamoDBScanAsync = promisify(this.ddb.scan).bind(this.ddb);
    this.dynamoDBPutAsync = promisify(this.ddb.put).bind(this.ddb);
  }

  async _getLatestBlock(networkID, event) {
    let params = {
      TableName: this.tblName,
      Key: {
        networkid: networkID,
        event: event
      }
    };

    let result = await this.dynamoDBGetAsync(params);

    if (typeof result.Item === "undefined") {
      await this._initLatestBlock(networkID, event);
      return 1;
    } else {
      return result.Item.latestBlock
    }
  };

  async _initLatestBlock(networkID, event) {
    let params = {
      TableName: this.tblName,
      Item: {
        networkid: networkID,
        event: event,
        latestBlock: 1
      }
    };

    let result = await this.dynamoDBPutAsync(params);
  };
  
  async _updateLatestBlock(networkID, latestBlock= "1", event) {
    let eventType = event;

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
