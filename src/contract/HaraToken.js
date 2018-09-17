export default class HaraToken {
  constructor(web3Node, abi, contractBinary) {
    this.web3 = web3Node;
    this.hart = new this.web3.eth.Contract(abi);
    this.abi = abi;
    this.binary = contractBinary;
  }

  // you need trigger this after deploy or reading a contract
  _initHart = async (abi, contract_address) => {
    this.hart = await new this.web3.eth.Contract(abi, contract_address);
    this.hart_address = contract_address;
    return this.hart;
  };

  _burn = async (tokenVal, data, fromAccount) => {
    return new Promise(async (resolve, reject) => {
      if (typeof fromAccount === "string") {
        let transaction = await this.hart.methods
          .burnToken(tokenVal, data)
          .send({ from: fromAccount });
        resolve(transaction);
        return transaction;
      } else {
        console.warn("Haratoken@_burn typeof account must string", fromAccount);
        return false;
      }
    });
  };

  _mint = async (data, sender, pk, from, nonceSender) => {
    // parse `from` network id from data
    var log_source = data.data[0];
    if (!log_source || Number.isNaN(Number(log_source))) {
      log_source = from;
    }

    // create raw data for sign transaction
    var raw_data = await this.hart.methods
      .mintToken(data.id, data.burner, data.value, data.hashDetails, log_source)
      .encodeABI();

    // // transaction data to sign
    const txData = {
      // nonce: await this.web3.eth.getTransactionCount(sender),
      nonce: nonceSender,
      to: this.hart_address,
      from: sender,
      data: raw_data,
      gasPrice: await this.web3.eth.getGasPrice()
    };

    txData.gas = await this.web3.eth.estimateGas(txData);

    // // sign and send transaction
    var rawTx = await this.web3.eth.accounts.signTransaction(txData, pk);
    this.web3.eth.sendSignedTransaction(rawTx.rawTransaction);
    return { id: data.id, mint_status: "pending" };
  };

  _watch = async (block_number, contract_address, topics, singleLog = false) => {
    try {
      let fromBlock = this.web3.utils.toHex(block_number);

      let objData = {
        fromBlock: fromBlock,
        address: contract_address,
        topics: topics
      }

      if(singleLog) {
        objData = {...objData, toBlock: fromBlock}
      }

      var logs = await this.web3.eth.getPastLogs(objData);

      return logs;
    } catch (error) {
      console.warn("HaraToken@watch", error);
      return false;
    }
  };

  _getTopicMain = () => {
    var burnLogTopic = this.web3.utils.sha3(
      "BurnLog(uint256,address,uint256,bytes32,string)"
    );

    return burnLogTopic;
  };

  _getTopicPriv = () => {
    var burnLogTopic = this.web3.utils.sha3(
      "MintLog(uint256,address,uint256,bool)"
    );

    return burnLogTopic;
  };

  _getGasPrice = async () => {
    return await this.web3.eth.getGasPrice();
  };

  _decodeData = async (abi, data, topics) => {
    return await this.web3.eth.abi.decodeLog(abi, data, topics.slice(1));
  };

  _getNonce = async sender => {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransactionCount(sender).then(val => {
        resolve(val)
      }).catch(err=> {
        resolve(false);
        console.log("HaraToken@_getNonce", err.message);
      });
    });
  };

  _getBlockNumberTimestamp = async (blockNumber) => {
    const block = await this.web3.eth.getBlock(blockNumber);
    let timeStamp = (block.timestamp * 1000);
    return new Date(timeStamp).toISOString();
  }
}
