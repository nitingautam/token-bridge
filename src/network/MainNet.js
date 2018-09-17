import {
  mainWeb3,
  privateKey,
  mainNetAccount,
  mainNetContractAddress
} from "../constants/Web3Config";
import HaraToken from "../contract/HaraToken";
import ContractDetail from "../model/ContractDetails";
import utilHelper from "../helpers/utilHelper";
import { hartABI, burnLogABI } from "../constants/AbiFiles";
import { hartContractBinary } from "../constants/Binary";
import BlockchainWatcherBlock from "../model/BlockchainWatcherBlock";
import PrivateNet from "./PrivateNet";
import BlockchainWatcher from "../model/BlockchainWatcher";
import { DEFAULT_PARTITION_LIMIT } from "../constants/LogWatcherConfig";

export default class MainNet {
  constructor() {
    this.web3 = mainWeb3;
    this.haraToken = new HaraToken(this.web3, hartABI, hartContractBinary);
  }

  _getContractAddress = () => {
    return mainNetContractAddress;
  };

  _testBurn = async (tokenVal = 1, data = "") => {
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

  _watch = async (startBlock = 1, singleBlock = false) => {
    let contractAddress = await this._getContractAddress();

    console.log("watching contract address", contractAddress);

    await this.haraToken._initHart(hartABI, contractAddress);
    let logs = await this.haraToken._watch(
      startBlock,
      contractAddress,
      [this.haraToken._getTopicMain()],
      singleBlock
    );

    return logs;
  };

  _mainWatcher = async (runMint = true, startBlock = false) => {
    console.log("=== main watcher Running on "+ new Date().toISOString() +" ===");

    let latestBlockMain = await new BlockchainWatcherBlock()._getLatestBlock(
      "1"
    );

    const privNet = await new PrivateNet();
    const modelBlockChainWatcher = new BlockchainWatcher();
    const modelBlockchainWatcherBlock = new BlockchainWatcherBlock();

    let mintAccount = await privNet._getMintAccount();

    if (startBlock) {
      latestBlockMain = startBlock;
    }

    let _blockLogs = await this._watch(latestBlockMain);
    let mintedData = [];
    let burnIDList = [];

    let latestBlockNumber = latestBlockMain;

    for (const singleLog of _blockLogs) {
      let partitionKey = await modelBlockChainWatcher._checkPartitionKey(
        DEFAULT_PARTITION_LIMIT
      );

      let _data = await privNet._decodeData(
        burnLogABI,
        singleLog.data,
        singleLog.topics
      );

      if (typeof _data.burner !== "undefined" && "burner" in _data) {
        const result = await modelBlockChainWatcher._generateBurnItem(
          singleLog,
          _data,
          partitionKey,
          "1"
        );

        const joinedBurnID = result.id;
        const checkDB = await modelBlockChainWatcher._getData(joinedBurnID);

        burnIDList.push(joinedBurnID);

        if (checkDB === false) {
          await modelBlockChainWatcher._insertData(result);

          if (runMint) {
            let nonce = await privNet._getNonce(mintAccount);

            console.log("running minting on joinedBurnID=" + joinedBurnID);

            try {
              await privNet._mint(_data, mintAccount, privateKey, "1", nonce);

              let mintedResult = await modelBlockChainWatcher._updateMintStatus(
                "pending",
                joinedBurnID
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
          "1",
          logBlockNumber
        );
      }
    }

    return {
      minted_data: mintedData,
      last_block: latestBlockNumber,
      burn_id: burnIDList
    };
  };

  _getAccounts =  () => {
    return [mainNetAccount];
  };

  _getBlockNumberTimeStamp = async blockNumber => {
    return await this.haraToken._getBlockNumberTimestamp(blockNumber);
  };

  _manualMint = async (burnID, networkID = "1") => {
    const modelBlockChainWatcher = new BlockchainWatcher();
    const privNet = new PrivateNet();

    let joinedBurnID = modelBlockChainWatcher._getJoinedBurnID(
      burnID,
      networkID
    );

    let data = await modelBlockChainWatcher._getData(joinedBurnID);
    let blockLog = await this._watch(data.burn_block_number, true);

    let result = [];

    for (const singleLog of blockLog) {
      if (singleLog.transactionHash == data.burn_txhash) {
        let _data = await privNet._decodeData(
          burnLogABI,
          singleLog.data,
          singleLog.topics
        );

        let mintAccount = privNet._getMintAccount();
        let nonce = await privNet._getNonce(mintAccount);

        try {
          await privNet._mint(_data, mintAccount, privateKey, "1", nonce);

          let mintedResult = await modelBlockChainWatcher._updateMintStatus(
            "manual_mint",
            joinedBurnID
          );

          result.push(mintedResult);
        } catch (error) {
          result.push({
            status: 0,
            transaction_hash: singleLog.transactionHash,
            message:
              "This transaction was done, please check at /get_transaction_by_id?burn_id=" +
              burnID +
              "&network_id=" +
              networkID
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
}
