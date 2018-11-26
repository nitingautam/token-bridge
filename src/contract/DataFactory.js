import utilHelper from "../helpers/utilHelper";
import { testAccount } from "../constants/Web3Config"
import { dataFactoryPrivateKey } from "../constants/Web3Config"

const Tx = require('ethereumjs-tx');

export default class DataFactory {
  constructor(web3Node, abi, contractBinary) {
    this.web3 = web3Node;
    this.dataFactory = new this.web3.eth.Contract(abi);
    this.abi = abi;
    this.binary = contractBinary;
  }

  // you need trigger this after deploy or reading a contract
  async _initDataFactory (abi, contract_address) {
    this.contract_address = contract_address;
    this.dataFactory = await new this.web3.eth.Contract(abi, contract_address, {
      from: testAccount, // default from address
      gasPrice: await this._getGasPrice() // default gas price
    });
    return this.dataFactory;
  };

  async _storeData (_owner, _location, _locationId, _signature, _signatureFunc = "keccak") {
    _locationId = this.web3.utils.fromAscii(_locationId);
    _signature = this.web3.utils.fromAscii(_signature);
    _signatureFunc = this.web3.utils.fromAscii(_signatureFunc);

    let req = {_owner, _location, _locationId, _signature, _signatureFunc};
    let raw_data = await this.dataFactory.methods.storeData(_owner, _location, _locationId, _signature, _signatureFunc).encodeABI();

    let txData = {
      // nonce: await this.web3.eth.getTransactionCount(sender),
      from: _owner,
      data: raw_data,
      to: this.contract_address
    };
    txData.gas = await this.web3.eth.estimateGas(txData);

    // // sign and send transaction
    let rawTx = await this.web3.eth.accounts.signTransaction(txData, dataFactoryPrivateKey);
    let signedTx = await this.web3.eth.sendSignedTransaction(rawTx.rawTransaction);

    return signedTx;
  };

  /* async _storeData (_owner, _location, _signature, _signatureFunc, _metaKey = [""], _metaValue = [""]) {
    _location = this.web3.utils.fromAscii(_location);
    _signature = this.web3.utils.fromAscii(_signature);
    _signatureFunc = this.web3.utils.fromAscii(_signatureFunc);

    for(let i = 0; i < _metaKey.length; ++i){
      _metaKey[i] = this.web3.utils.fromAscii(_metaKey[i]);
    }

    for(let i = 0; i < _metaValue.length; ++i){
      _metaValue[i] = this.web3.utils.fromAscii(_metaValue[i]);
    }

    let raw_data = await this.dataFactory.methods.storeData(_owner, _location, _signature, _signatureFunc, _metaKey, _metaValue).encodeABI();

    let txData = {
      // nonce: await this.web3.eth.getTransactionCount(sender),
      from: _owner,
      data: raw_data,
      to: this.contract_address
    };
    txData.gas = await this.web3.eth.estimateGas(txData);

    // // sign and send transaction
    let rawTx = await this.web3.eth.accounts.signTransaction(txData, dataFactoryPrivateKey);
    let signedTx = await this.web3.eth.sendSignedTransaction(rawTx.rawTransaction);

    return signedTx;
  }; */

  async _watch (transactionHash) {
    let r = await this.web3.eth.getTransactionReceipt(transactionHash);
    console.log(r);
    return r;
  };

  _getTopicMain() {
    var burnLogTopic = this.web3.utils.sha3(
      "BurnLog(uint256,address,uint256,bytes32,string)"
    );

    return burnLogTopic;
  };

  _getTopicPriv () {
    var burnLogTopic = this.web3.utils.sha3(
      "MintLog(uint256,address,uint256,bool)"
    );

    return burnLogTopic;
  };

  async _getGasPrice() {
    return await this.web3.eth.getGasPrice();
  };

  async _decodeData (type, value, topics) {
    return await this.web3.eth.abi.decodeLog(type, value, topics.slice(1));
  };

  async_getNonce (sender) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransactionCount(sender).then(val => {
        resolve(val)
      }).catch(err=> {
        resolve(false);
        console.log("HaraToken@_getNonce", err.message);
      });
    });
  };
}
