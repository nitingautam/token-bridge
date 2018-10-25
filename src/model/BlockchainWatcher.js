import { InitDB, TB_WATCHER, Mapper } from "../constants/DbConfig";
import { promisify } from "util";
import {
  DynamoDbSchema,
  DynamoDbTable,
} from "@aws/dynamodb-data-mapper";
import MainNet from "../network/MainNet";
import { defaultMintNetworkID, watcherNetworkID } from "../constants/Web3Config";

// if you are using mapper please use this class
class _dbWatcher {}
Object.defineProperties(_dbWatcher.prototype, {
  [DynamoDbTable]: {
    value: TB_WATCHER
  },
  [DynamoDbSchema]: {
    value: {
      part_key: {
        type: "String",
        keyType: "HASH"
      },
      id: {
        type: "String",
        keyType: "RANGE"
      },
      address: { type: "String" },
      added_timestamp: { type: "String" },
      burn_timestamp: { type: "String" },
      burn_txhash: { type: "String" },
      burn_status: { type: "String" },
      burn_block_number: { type: "Number" },
      burn_data: { type: "String" },
      from: { type: "String" },
      hashDetails: { type: "String" },
      info: { type: "Number" },
      mint_status: { type: "String" },
      mint_timestamp: { type : "String" },
      part_key_length: { type: "Number" },
      to: { type: "String" },
      mint_txhash: { type: "String" },
      hart_value: { type: "Number" }
    }
  }
});

export default class BlockchainWatcher {
  constructor() {
    this.tblName = TB_WATCHER;

    console.log("BlockchainWatcher", TB_WATCHER);

    this.ddb = InitDB();
    this.dynamoDBGetAsync = promisify(this.ddb.get).bind(this.ddb);
    this.dynamoDBUpdateAsync = promisify(this.ddb.update).bind(this.ddb);
    this.dynamoDBQueryAsync = promisify(this.ddb.query).bind(this.ddb);
    this.dynamoDBScanAsync = promisify(this.ddb.scan).bind(this.ddb);
    this.dynamoDBPutAsync = promisify(this.ddb.put).bind(this.ddb);
  }

  async _insertData(data) {
    return new Promise((resolve, reject) => {
      const db = new _dbWatcher();
      let _item = Object.assign(db, data);

      Mapper.put({ item: _item }).then(() => {
        resolve({
          status: 1,
          data: _item,
          message: "Item ID successfull saved" + _item.id
        });
      });
    });
  };

  async _getData(joinedBurnID) {
    let partitionKey = await this._getPartitionKey();
    
    for (var i = 0; i < Number(partitionKey); i++) {
      let db = new _dbWatcher();
      db.part_key = Number(i);
      db.id = joinedBurnID;
      
      let result = await new Promise((resolve, reject) => {
        Mapper.get({ item: db }).then(val => {
          resolve(val);
        }).catch(err => {
          console.log("BlockchainWatcher@_getData data not found partKey=" + db.part_key + " joinedID=" + joinedBurnID);
          resolve(false);
        });
      });

      if(result) {
        return result;
      }
    }

    return false;
  };

  async _getMintDetail(mintTxHash) {
    let partitionKey = await this._getPartitionKey();
    
    for (var i = 0; i < Number(partitionKey); i++) {
      try {
        var params = {
          TableName: this.tblName,
          IndexName: "partkey_minttxhash",
          ExpressionAttributeNames: {
            "#part_key": "part_key",
            "#mint_txhash": "mint_txhash"
          },
          ExpressionAttributeValues: {
            ":part_key": i.toString(),
            ":mint_txhash": mintTxHash.toString(),
          },
          KeyConditionExpression: "#part_key = :part_key and #mint_txhash = :mint_txhash",
          ScanIndexForward: false,
          Limit: 1
        };
        
        return await this.dynamoDBQueryAsync(params);
      } catch (error) {
        console.log(error.message);
        console.log("BlockchainWatcher@_getMintDetail data not found partKey=" + Number(i) + " mint_txhash=" + mintTxHash);
        return false;
      }
    }

    return false;
  };


  _padNumber(num, padlen) {
    var pad = new Array(1 + padlen).join(0);
    return (pad + num).slice(-pad.length);
  };

  _getPadNumberByID(ID, from = "1") {
    let id = this._padNumber(ID, 12);
    let _from = this._padNumber(from.toString(), 4);

    _from = _from.concat(id);
    return _from;
  };

  _getJoinedBurnID(burnID, network = "1") {
    const padNetworkID = this._padNumber(network, 4);
    const padID = this._padNumber(burnID.toString(), 12);
    return padNetworkID.concat(padID);
  }

  async _updateMintStatus(status, joinedBurnID, mintTxHash = false) {
    try {
      let queryData = await this._getData(joinedBurnID);
      let saveStatus = {status:0, message: "Failed to update joinedBurnID=" + joinedBurnID};

      if(queryData) {
        let db = new _dbWatcher();
        let _item = Object.assign(db, queryData);
        
        if(mintTxHash) {
          _item.mint_txhash = mintTxHash
        }

        _item.mint_status = status;
  
        if(status === "true") {
          _item.mint_timestamp = new Date().toISOString();
        }
  
        saveStatus = await new Promise((resolve, reject) => {
          Mapper.put({ item: _item }).then(() => {
            resolve({
              status: 1,
              data: _item,
              message: "Minted succesfull updated burnID=" + _item.id + " status=" + status,
            });
          }).catch(err => {
            resolve({
              status: 0,
              data: _item,
              message: "Minted update failed on burnID=" + _item.id,
            })
          });
        });
  
        return saveStatus;
      }
  
      return saveStatus;
      
    } catch (error) {
      console.error("BlockchainWatcher@_updateMintStatus", error.message);
    }
  };

  async _initPartitionInfo() {
    return new Promise((resolve, reject) => {
      const db = new _dbWatcher();
      db.part_key = "info";
      db.id = "latest_part_key";
      db.address = "*";
      db.burn_timestamp = "*";
      db.info = 1;

      Mapper.put({ item: db }).then(() => {
        resolve({
          status: 1,
          data: db,
          message: "BlockchainWatcher@_initPartitionInfo " + db.id
        });
      });
    });
  };

  async _initPartKeyLength() {
    return new Promise((resolve, reject) => {
      const db = new _dbWatcher();
      db.part_key = "0";
      db.id = "length";
      db.address = "**";
      db.burn_timestamp = "**";
      db.part_key_length = 0;

      Mapper.put({ item: db }).then(() => {
        resolve({
          status: 1,
          data: db,
          message: "BlockchainWatcher@_initPartKeyLength " + db.id
        });
      });
    });
  };

  async _getPartitionKey() {
    return new Promise((resolve, reject) => {
      const db = new _dbWatcher();
      db.part_key = "info";
      db.id = "latest_part_key";

      Mapper.get(db)
        .then(val => {
          resolve(val.info);
        })
        .catch(async err => {
          await this._initPartitionInfo();
          console.warn("BlockchainWatcher@_getPartitionKey", err.message);
          resolve(1);
        });
    });
  };

  async _checkPartitionKey(limit = 1000000) {
    return new Promise(async (resolve, reject) => {
      var current_pk = await this._getPartitionKey();

      var pk;
      // check current partitionkey limit, misal currentpk = 2 [0,1]

      let partKeyLength = await new Promise(async (resolve, reject) => {
        const db = new _dbWatcher();
        db.part_key = (current_pk - 1).toString();
        db.id = "length";

        await Mapper.get(db)
          .then(async val => {
            resolve(val.part_key_length);
          })
          .catch(async err => {
            await this._initPartKeyLength();
            console.warn("BlockchainWatcher@_checkPartitionKey", err.message);
            resolve(0);
          });
      });

      var pk_length = Number(partKeyLength);
      if (pk_length < limit) {
        pk = current_pk - 1;

        await this._updatePartitionKeyLength(
          current_pk - 1,
          pk_length + 1
        ).then(() => {
          
          resolve(pk);
        }).catch(err => {
          console.warn("BlockchainWatcher@_checkPartitionKey something error on update");
          resolve(0);
        });
      } else {
        await this._updatePartitionKeyInfo(current_pk + 1);

        const _db = new _dbWatcher();
        _db.part_key = current_pk.toString();
        _db.id = "length";
        _db.address = "**";
        _db.burn_timestamp = "**";
        _db.part_key_length = 1;

        await Mapper.put({ item: _db }).then(() => {
          resolve(pk);
        }).catch(err => {
          console.warn("BlockchainWatcher@_checkPartitionKey something error on update");
          resolve(0);
        });
      }
    });
  };

  async _updatePartitionKeyLength(pk, length) {
    const db = new _dbWatcher();
    db.part_key = pk.toString();
    db.id = "length";

    const fetched = await Mapper.get({ item: db });
    fetched.part_key_length = length;

    await Mapper.put({ item: fetched });
  };

  async _updatePartitionKeyInfo(pk) {
    const db = new _dbWatcher();
    db.part_key = "info";
    db.id = "latest_part_key";

    const fetched = await Mapper.get({ item: db });
    fetched.info = pk;

    await Mapper.put({ item: fetched });
  };
  
  async _generateBurnItem(log, data, partKey, from) {
    const id = this._padNumber(data.id, 12);

    from = data.data
      ? this._padNumber(watcherNetworkID, 4)
      : this._padNumber(from, 4);

    let to = data.data ? this._padNumber(data.data.slice(0, 1), 4) : this._padNumber(defaultMintNetworkID, 4);

    const mainNet = new MainNet();
    const item = {
      part_key: partKey.toString(),
      id: from.concat(id),
      address: data.burner,
      burn_txhash: log.transactionHash,
      burn_timestamp: await mainNet._getBlockNumberTimeStamp(log.blockNumber),
      burn_status: "true",
      burn_block_number: log.blockNumber,
      mint_status: "false",
      from: from,
      to: to,
      burn_data: data.data ? data.data.slice(2) : "null",
      hashDetails: data.hashDetails,
      added_timestamp: new Date().toISOString(),
      hart_value: parseInt(data.value),
    };

    return item;
  }

  async _getAddressTransaction(_address) {
    var pk = await this._getPartitionKey();
    var promises = [];
    for (var i = 0; i < Number(pk); i++) {
      var params = {
        TableName: this.tblName,
        IndexName: "address_idx",
        ExpressionAttributeValues: {
          ":part_key": i.toString(),
          ":address": _address
        },
        KeyConditionExpression: "part_key = :part_key and address = :address"
      };

      console.log(params);

      promises.push(this.dynamoDBQueryAsync(params));
    }
    var result = await Promise.all(promises);
    return result;
  }

  async _getIdTransaction(networkID, burnID) {
    let joinedBurnID = this._getJoinedBurnID(burnID, networkID);

    return await this._getData(joinedBurnID);
  }

  async _getTimestampTransaction(lastSortDate, limit) {
    var pk = await this._getPartitionKey();
    var promises = [];
    for (var i = 0; i < Number(pk); i++) {
      var params = {
        TableName: this.tblName,
        IndexName: "partkey_burn_idx",
        ExpressionAttributeValues: {
          ":part_key": i.toString(),
          ":burn_timestamp": lastSortDate
        },
        Limit: limit,
        ScanIndexForward: false,
        KeyConditionExpression:
          "part_key = :part_key and burn_timestamp < :burn_timestamp"
      };
      promises.push(this.dynamoDBQueryAsync(params));
    }
    var result = await Promise.all(promises);
    return result;
  }

  async _getDataTransaction(_data) {
    const params = {
      TableName: this.tblName,
      ExpressionAttributeValues: {
        ":data": _data
      },
      FilterExpression: "burn_data = :data"
    };

    const result = await this.dynamoDBScanAsync(params);
    return result;
  }
}
