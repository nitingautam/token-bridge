import { InitDB, TB_CONTRACT_DETAILS } from "../constants/DbConfig";
import { promisify } from "util";
export default class ContractDetail {
  constructor() {
    this.tblName = TB_CONTRACT_DETAILS;

    this.ddb = InitDB();
    this.dynamoDBGetAsync = promisify(this.ddb.get).bind(this.ddb);
    this.dynamoDBUpdateAsync = promisify(this.ddb.update).bind(this.ddb);
    this.dynamoDBQueryAsync = promisify(this.ddb.query).bind(this.ddb);
    this.dynamoDBScanAsync = promisify(this.ddb.scan).bind(this.ddb);
    this.dynamoDBPutAsync = promisify(this.ddb.put).bind(this.ddb);
  }

  _getMainContractAddress = () => {
    let params = {
      TableName: this.tblName,
      Key: {
        key: 1,
        contract_network_name: "main_network"
      }
    };

    return this._getContractAddress(params);
  };

  _getPrivContractAddress = () => {
    let params = {
      TableName: this.tblName,
      Key: {
        key: 2,
        contract_network_name: "priv_network"
      }
    };

    return this._getContractAddress(params);
  };

  _getContractAddress = (params) => {
    return new Promise((resolve, reject) => {
      this.ddb.get(params, (err, data) => {
        if (err) {
          console.log("ContractDetails@_getMainContractAddress error on data not found");
          resolve(false);
          return false;
        }

        if (typeof data == "object" && "Item" in data) {
          resolve(data.Item.contract_address);
        } else {
          console.log("ContractDetails@_getMainContractAddress data not object");
          resolve(false);
        }
      });
    });
  }

  _insertData = async (item) => {
    var params = {
      TableName: this.tblName,
      Item: item
    };

    console.log(params);

    return await this.dynamoDBPutAsync(params);
  }

}
