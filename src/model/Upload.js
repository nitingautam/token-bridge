import { InitDB, TB_UPLOAD, TB_UPLOAD_COUNTER, TB_UPLOADER_NAME } from "../constants/DbConfig";
import { promisify } from "util";
import utilHelper from '../helpers/utilHelper';

export default class Upload {
  
  constructor() {
    this.PENDING = "PENDING";
    this.SUCCEED = "SUKSES";
    this.tblName = TB_UPLOAD;
    this.tblCounter = TB_UPLOAD_COUNTER;
    this.tblUploaderName = TB_UPLOADER_NAME;

    this.ddb = InitDB();
    this.dynamoDBGetAsync = promisify(this.ddb.get).bind(this.ddb);
    this.dynamoDBUpdateAsync = promisify(this.ddb.update).bind(this.ddb);
    this.dynamoDBQueryAsync = promisify(this.ddb.query).bind(this.ddb);
    this.dynamoDBScanAsync = promisify(this.ddb.scan).bind(this.ddb);
    this.dynamoDBPutAsync = promisify(this.ddb.put).bind(this.ddb);
  }

  async _insertData (uploaderName = "hara", id, networkid = "1",  dataId, dataName, timestamp = utilHelper.getIsoDate(), 
                uploaderAddress = "*", contractAddress = "*", transactionHash = "*", endpoint = "*", signature = "*", description = "*", status = this.PENDING, index = "*"){
    let params = {
      TableName: this.tblName,
      Item: {
        uploaderName,
        id,
        networkid,
        dataId,
        dataName,
        description,
        timestamp: timestamp + "",
        uploaderAddress,
        contractAddress,
        transactionHash,
        endpoint,
        signature,
        status,
        index
      }
    };
    let result = await this.dynamoDBPutAsync(params);
    return params.Item;
  };

  async _insertDataByItem(Item) {
    let params = {
      TableName: this.tblName,
      Item
    };
    let result = await this.dynamoDBPutAsync(params);
    return params.Item;
  };

  async _getData (uploaderName = "hara", timestamp){
    let params = {
      TableName: this.tblName,
      Key: {
        uploaderName,
        timestamp
      }
    };
    let result = await this.dynamoDBGetAsync(params);
    if (typeof result.Item === "undefined"){
      return "";
    }
    return result.Item;
  };

  async _initSpecialData(){
    let params = {
      TableName: this.tblName,
      Item: {
        uploaderName: "SPECIAL",
        id: 0,
        networkid: "*",
        dataId: "*",
        dataName: "*",
        description: "*",
        timestamp: "0000-00-00000:00:00.000Z",
        uploaderAddress: "*",
        contractAddress: "*",
        transactionHash: "*",
        endpoint: "*",
        signature: "*",
        status: "*"
      }
    };
    utilHelper.log(params);
    let result = await this.dynamoDBPutAsync(params);
    return params.Item;
  };

  async _queryPendingData (status = "PENDING", index = "*", limit = 100) {
    let params = {
      TableName: this.tblName,
      IndexName: "status_index",
      Limit: limit,
      KeyConditionExpression:"#status = :status and #index = :index",
      ExpressionAttributeNames: {
        "#status":"status",
        "#index":"index"
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":index": index
      }
    };
    let result = await this.dynamoDBQueryAsync(params);
    return result.Items;
  };

  async _queryDataName (uploaderName = "PENDING", dataName = "*", limit = 100) {
    let params = {
      TableName: this.tblName,
      IndexName: "uploaderName_dataName",
      Limit: limit,
      KeyConditionExpression:"#uploaderName = :uploaderName and #dataName = :dataName",
      ExpressionAttributeNames: {
        "#uploaderName":"uploaderName",
        "#dataName":"dataName"
      },
      ExpressionAttributeValues: {
        ":uploaderName": uploaderName,
        ":dataName": dataName
      }
    };
    let result = await this.dynamoDBQueryAsync(params);
    return result.Items;
  };

  /* _queryPendingData = async (uploaderName, status) => {
    let params = {
      TableName: this.tblName,
      IndexName: "uploaderName_status",
      KeyConditionExpression:"#uploaderName = :uploaderName and #status = :status",
      ExpressionAttributeNames: {
        "#uploaderName":"uploaderName",
        "#status":"status"
      },
      ExpressionAttributeValues: {
        ":uploaderName": uploaderName,
        ":status": status
      }
    };
    let result = await this.dynamoDBQueryAsync(params);
    return result.Items;
  };

  _scanPendingData = async (limit = 100) => {
    let params = {
      TableName: this.tblName,
      Limit: limit,
      ExpressionAttributeNames: {"#status": "status"},
      ExpressionAttributeValues: {":pending": "PENDING"},
      FilterExpression: "#status = :pending"
    };
    let result = await this.dynamoDBScanAsync(params);
    return result.Items;
  }; */

  async _updatePendingData (uploaderName, timestamp) {
    let params = {
      TableName: this.tblName,
      Key: {
        uploaderName,
        timestamp
      },
      UpdateExpression: "set #status = :sukses",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":sukses": "SUKSES"
      },
      ReturnValues: "ALL_NEW"
    };
    let result = await this.dynamoDBUpdateAsync(params);
    if (typeof result.Attributes === "undefined"){
      return "";
    }
    return result.Attributes;
  }

  async _updateSpecialData (uploaderName, timestamp, index, indexVal = null) {
    let params = {
      TableName: this.tblName,
      Key: {
        uploaderName,
        timestamp
      },
      UpdateExpression: "set #status = :sukses, #index = :index",
      ExpressionAttributeNames: {
        "#status": "status",
        "#index": index
      },
      ExpressionAttributeValues: {
        ":sukses": "SUKSES",
        ":index": indexVal
      },
      ReturnValues: "ALL_NEW"
    };
    let result = await this.dynamoDBUpdateAsync(params);
    if (typeof result.Attributes === "undefined"){
      return "";
    }
    return result.Attributes;
  }

  async _removeSpecialColumn (uploaderName, timestamp, index, indexVal = null) {
    let params = {
      TableName: this.tblName,
      Key: {
        uploaderName,
        timestamp
      },
      UpdateExpression: "remove #index",
      ExpressionAttributeNames: {
        "#index": index
      },
      ReturnValues: "ALL_NEW"
    };
    let result = await this.dynamoDBUpdateAsync(params);
    if (typeof result.Attributes === "undefined"){
      return "";
    }
    return result.Attributes;
  }

  async _getLatestId (id = 1) {
    let params = {
      TableName: this.tblCounter,
      Key: {
        id: id
      }
    };
    let result = await this.dynamoDBGetAsync(params);
    utilHelper.log(result);
    if (typeof result.Item === "undefined"){
      return await this._initLatestId(1);
    }
    return result.Item.id_upload_latest;
  };

  async _initLatestId (id = 1) {
    let params = {
      TableName: this.tblCounter,
      Item: {
        id: id,
        id_upload_latest: 1
      }
    };
    let result = await this.dynamoDBPutAsync(params);
    utilHelper.log(result);
    return 1;
  };

  async _updateLatestId (id = 1, id_upload_latest) {
    let params = {
      TableName: this.tblCounter,
      Key: {
        id
      },
      UpdateExpression: "set id_upload_latest = :id_upload_latest",
      ExpressionAttributeValues: {
        ":id_upload_latest": id_upload_latest
      },
      ReturnValues: "UPDATED_NEW"
    };
    let result = await this.dynamoDBUpdateAsync(params);
    utilHelper.log(result);
    return result;
  };

  async _getUploaderName (uploaderName) {
    let params = {
      TableName: this.tblUploaderName,
      Key: {
        uploaderName
      }
    };
    let result = await this.dynamoDBGetAsync(params);
    if (typeof result.Items === "undefined"){
      return "";
    }
    return result.Item.uploaderName;
  };

  async _scanUploaderName (limit = 100) {
    let params = {
      TableName: this.tblUploaderName,
      Limit: limit
    };
    utilHelper.log(params);
    let result = await this.dynamoDBScanAsync(params);
    if (typeof result.Items[0] === "undefined"){
      return await this._initUploaderName("hara");
    }
    return result.Items;
  }

  async _initUploaderName (uploaderName = "hara") {
    let params = {
      TableName: this.tblUploaderName,
      Item: {
        uploaderName
      }
    };
    let result = await this.dynamoDBPutAsync(params);
    utilHelper.log(result);
    return [{ uploaderName }];
  };

  async _insertUploader (uploaderName) {
    let params = {
      TableName: this.tblUploaderName,
      Item: {
        uploaderName
      }
    };
    utilHelper.log(params);
    let result = await this.dynamoDBPutAsync(params);
    return result;
  };

}
