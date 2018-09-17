import { privWeb3, mintSender, privNetAccount, privNetContractAddress } from "../constants/Web3Config";
import HaraToken from "../contract/HaraToken";
import ContractDetail from "../model/ContractDetails";
import { privHartABI, mintLogABI } from "../constants/AbiFiles";
import { privHartContractBinary } from "../constants/Binary";
import BlockchainWatcher from "../model/BlockchainWatcher";
import BlockchainWatcherBlock from "../model/BlockchainWatcherBlock";

export default class PrivateNet {
  constructor() {
    this.web3 = privWeb3;
    this.haraToken = new HaraToken(
      this.web3,
      privHartABI,
      privHartContractBinary
    );
  }

  _setContractAddress = async contractAddress => {
    let item = {
      key: 2,
      contract_network_name: "priv_network",
      contract_address: contractAddress
    };

    await new ContractDetail()._insertData(item);
  };

  _getContractAddress = () => {
    return privNetContractAddress;
  };

  _getAccounts = () => {
    return [privNetAccount];
  };

  _getMintAccount = () => {
    return mintSender;
  };

  _decodeData = async (abi = mintLogABI, data, topics) => {
    let privContractAddress = await this._getContractAddress();
    await this.haraToken._initHart(privHartABI, privContractAddress);

    return await this.haraToken._decodeData(abi, data, topics);
  };

  _getNonce = async account => {
    return await this.haraToken._getNonce(account);
  };

  _mint = async (data, account, primaryKey, from, nonceSender) => {
    let privContractAddress = await this._getContractAddress();

    await this.haraToken._initHart(privHartABI, privContractAddress);

    return await this.haraToken._mint(
      data,
      account,
      primaryKey,
      from,
      nonceSender,
      privContractAddress
    );
  };

  _watch = async (startBlock = 1) => {
    let privContractAddress = await this._getContractAddress();

    await this.haraToken._initHart(privHartABI, privContractAddress);
    let logs = await this.haraToken._watch(startBlock, privContractAddress, [
      this.haraToken._getTopicPriv()
    ]);

    return logs;
  };

  _privateWatcher = async () => {
    console.log("=== private watcher "+ new Date().toISOString() +" ===");

    const modalBlockChainWatcherBlock = new BlockchainWatcherBlock();
    const modalBlockChainWatcher = new BlockchainWatcher();

    const latestBlockPriv = await modalBlockChainWatcherBlock._getLatestBlock(
      "2"
    );

    const blockLogs = await this._watch(latestBlockPriv);

    let result = [];
    for (const singleLog of blockLogs) {
      const topics = singleLog.topics;
      const hashData = singleLog.data;

      const decodedData = await this._decodeData(mintLogABI, hashData, topics);

      if (
        typeof decodedData.status !== "undefined" &&
        decodedData.status === true
      ) {
        const burnID = decodedData.id;
        const joinedBurnID = modalBlockChainWatcher._getJoinedBurnID(burnID);

        let queryResult = await modalBlockChainWatcher._getData(joinedBurnID);

        if (queryResult.mint_status != "true") {
          console.log("update minting status on joinedBurnID=" + joinedBurnID);
          let updateResult = await modalBlockChainWatcher._updateMintStatus(
            "true",
            joinedBurnID
          );

          let logBlockNumber = singleLog.blockNumber;
          await modalBlockChainWatcherBlock._updateLatestBlock(
            "2",
            logBlockNumber
          );
          result.push(updateResult);
        }
      }
    }

    return result;
  };
}
