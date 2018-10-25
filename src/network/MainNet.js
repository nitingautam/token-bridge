import {
  watcherNetwork,
  privateKey,
  watcherNetworkAccount,
  watcherContractAddress,
  watcherNetworkID,
} from "../constants/Web3Config";
import HaraToken from "../contract/HaraToken";
import { hartABI, burnLogABI, mintLogABI } from "../constants/AbiFiles";
import { hartContractBinary } from "../constants/Binary";
import BlockchainWatcherBlock from "../model/BlockchainWatcherBlock";
import PrivateNet from "./PrivateNet";
import BlockchainWatcher from "../model/BlockchainWatcher";
import { DEFAULT_PARTITION_LIMIT } from "../constants/LogWatcherConfig";

export default class MainNet {
  constructor() {
    this.web3 = watcherNetwork;
    this.haraToken = new HaraToken(this.web3, hartABI, hartContractBinary);
    this.debug = process.env.DEBUG ? process.env.DEBUG : "false";
  }

  _getContractAddress() {
    return watcherContractAddress;
  };

  _getAccounts() {
    return [watcherNetworkAccount];
  };

  async _getBlockNumberTimeStamp(blockNumber) {
    return await this.haraToken._getBlockNumberTimestamp(blockNumber);
  };

  async _decodeData(abi = mintLogABI, data, topics, contractAddress = false) {
    let mainContractAddress = await this._getContractAddress();
    if(contractAddress) {
      mainContractAddress = contractAddress;
    }
    await this.haraToken._initHart(hartABI, mainContractAddress);

    return await this.haraToken._decodeData(abi, data, topics);
  };

  async _testBurn(tokenVal = 1, data = "") {
    try {
      let accounts = await this._getAccounts();
      accounts = accounts[0];

      let mainContractAddress = await this._getContractAddress();
      await this.haraToken._initHart(hartABI, mainContractAddress);

      let burnLog = this.haraToken._burn(tokenVal, data, accounts);

      if (!burnLog) {
        console.warn("burn failed");
        return false;
      }

      return burnLog;
    } catch (error) {
      console.warn("MainNet@_testBurn", error);
      return false;
    }
  };

  async _watch(startBlock = 1, singleBlock = false, isMint = false) {
    let contractAddress = await this._getContractAddress();

    console.log("watching contract address", contractAddress);

    await this.haraToken._initHart(hartABI, contractAddress);
    let logs = await this.haraToken._watch(
      startBlock,
      contractAddress,
      [isMint ? this.haraToken._getTopicPriv() : this.haraToken._getTopicMain()],
      singleBlock
    );

    return logs;
  };

  async _burnWatcher(runMint = true, startBlock = false) {
    console.log("=== main watcher Running on "+ new Date().toISOString() +" ===");

    let latestBlockMain = await new BlockchainWatcherBlock()._getLatestBlock(
      watcherNetworkID, "burn"
    );
    if (this.debug == "true") console.log(latestBlockMain);

    const privNet = await new PrivateNet();
    const modelBlockChainWatcher = new BlockchainWatcher();
    const modelBlockchainWatcherBlock = new BlockchainWatcherBlock();

    let mintAccount = await privNet._getMintAccount();
    if (this.debug == "true") console.log(mintAccount);

    if (startBlock) {
      latestBlockMain = startBlock;
    }
    if (this.debug == "true") console.log(startBlock);

    let _blockLogs = await this._watch(latestBlockMain);
    let mintedData = [];
    let burnIDList = [];

    if (this.debug == "true") console.log(mintedData);
    if (this.debug == "true") console.log(burnIDList);

    let latestBlockNumber = latestBlockMain;
    if (this.debug == "true") console.log(latestBlockNumber);

    for (const singleLog of _blockLogs) {
      let partitionKey = await modelBlockChainWatcher._checkPartitionKey(
        DEFAULT_PARTITION_LIMIT
      );

      let _data = await this._decodeData(
        burnLogABI,
        singleLog.data,
        singleLog.topics
      );

      if (this.debug == "true") console.log(_data);

      if (typeof _data.burner !== "undefined" && "burner" in _data) {
        const result = await modelBlockChainWatcher._generateBurnItem(
          singleLog,
          _data,
          partitionKey,
          watcherNetworkID
        );

        const joinedBurnID = result.id;
        const checkDB = await modelBlockChainWatcher._getData(joinedBurnID);
        if (this.debug == "true") console.log(checkDB);
        burnIDList.push(joinedBurnID);

        // allan
        if (checkDB === false) {
          await modelBlockChainWatcher._insertData(result);

          if (runMint) {
            let nonce = await privNet._getNonce(mintAccount);
            if (this.debug == "true") console.log(nonce);

            try {
              let mintResult = await privNet._mint(_data, mintAccount, await privateKey(), watcherNetworkID, nonce);

              let mintedResult = await modelBlockChainWatcher._updateMintStatus(
                "pending",
                joinedBurnID,
                mintResult.mint_txhash
              );
              mintedData.push(mintedResult);
            } catch (error) {
              let mintedResult = await modelBlockChainWatcher._updateMintStatus(
                "failed",
                joinedBurnID
              );
              mintedData.push(mintedResult);
              console.log("error " + error.message);
            }
          } else {
            mintedData.push({ status: 0, data: result });
          }
        }

        let logBlockNumber = singleLog.blockNumber;

        latestBlockNumber = singleLog.blockNumber;
        await modelBlockchainWatcherBlock._updateLatestBlock(
          watcherNetworkID,
          logBlockNumber,
          "burn"
        );
      }
    }

    return {
      minted_data: mintedData,
      last_block: latestBlockNumber,
      burn_id: burnIDList
    };
  };

  async _mintWatcher() {
    console.log("=== private watcher "+ new Date().toISOString() +" ===");

    const modalBlockChainWatcherBlock = new BlockchainWatcherBlock();
    const modalBlockChainWatcher = new BlockchainWatcher();

    const latestBlockPriv = await modalBlockChainWatcherBlock._getLatestBlock(
      watcherNetworkID, "mint"
    );

    const blockLogs = await this._watch(latestBlockPriv, false, true);

    let result = [];
    for (const singleLog of blockLogs) {
      const topics = singleLog.topics;
      const hashData = singleLog.data;

      const decodedData = await this._decodeData(mintLogABI, hashData, topics);

      if (
        typeof decodedData.status !== "undefined" &&
        decodedData.status === true
      ) {
        let queryResult = await modalBlockChainWatcher._getMintDetail(singleLog.transactionHash);

        if("Items" in queryResult && queryResult.Items.length > 0) {
          queryResult = queryResult.Items[0];
  
          let joinedBurnID = queryResult.id;
          let resultNetworkID = queryResult.to;
          let watcherNetworkIDPadded = new BlockchainWatcher()._padNumber(watcherNetworkID, 4);
  
          if (queryResult.mint_status != "true" && resultNetworkID == watcherNetworkIDPadded) {
            console.log("update minting status on joinedBurnID=" + joinedBurnID);
            let updateResult = await modalBlockChainWatcher._updateMintStatus(
              "true",
              joinedBurnID
            );
  
            let logBlockNumber = singleLog.blockNumber;
            await modalBlockChainWatcherBlock._updateLatestBlock(
              watcherNetworkID,
              logBlockNumber,
              "mint"
            );
  
            result.push(updateResult);
          }
        }
      }
    }

    return result;
  };

  async _manualMint(burnID) {
    const modelBlockChainWatcher = new BlockchainWatcher();
    const privNet = new PrivateNet();

    let joinedBurnID = modelBlockChainWatcher._getJoinedBurnID(
      burnID,
      watcherNetworkID
    );

    let data = await modelBlockChainWatcher._getData(joinedBurnID);
    let result = [];

    if(!data) {
      result.push({
        status: 0,
        message: "data with burn_id=" + burnID + " and network_id=" + watcherNetworkID + " not found"
      });
      return result;
    }

    // check burn log first on chain
    let blockLog = await this._watch(data.burn_block_number, true);

    for (const singleLog of blockLog) {
      if (singleLog.transactionHash == data.burn_txhash) {
        let _data = await this._decodeData(
          burnLogABI,
          singleLog.data,
          singleLog.topics
        );

        let mintAccount = await privNet._getMintAccount();
        let nonce = await privNet._getNonce(mintAccount);

        console.log("===========", await privateKey());

        try {
          let mintResult = await privNet._mint(_data, mintAccount, await privateKey(), watcherNetworkID, nonce);

          let mintedResult = await modelBlockChainWatcher._updateMintStatus(
            "manual_mint",
            joinedBurnID,
            mintResult.mint_txhash
          );

          result.push(mintedResult);
        } catch (error) {
          result.push({
            status: 0,
            transaction_hash: singleLog.transactionHash,
            message:
              "This transaction was done, please check at /bridge/get_transaction_by_id?burn_id=" +
              burnID +
              "&network_id=" +
              watcherNetworkID
          });

          if (
            error.message ==
            "Returned error: VM Exception while processing transaction: revert"
          ) {
            console.log("data error on minting joinedBurnID=" + joinedBurnID);
          }
          console.log("error", error.message);
        }
      }
    }

    return result;
  };

  async _getTotalSupply() {

    console.log("check pk");
    await privateKey();
    try {
      let mainContractAddress = this._getContractAddress();
      await this.haraToken._initHart(hartABI, mainContractAddress);
  
      return await this.haraToken._totalSupply();    
      
    } catch (error) {
      console.error("Mainnet@_getTotalSupply", error.message);
      
      return 0
    }
  }
}
