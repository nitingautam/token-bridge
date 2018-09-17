import assert from "assert";
import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import BlockchainWatcherBlock from "../src/model/BlockchainWatcherBlock";
import {
  privateKey,
  mainProvider,
  mintSender,
  mainNetAccount,
  privNetAccount
} from "../src/constants/Web3Config";
import BlockchainWatcher from "../src/model/BlockchainWatcher";
import { DEFAULT_PARTITION_LIMIT } from "../src/constants/LogWatcherConfig";
import {
  burnLogABI,
  hartABI,
  privHartABI,
  mintLogABI
} from "../src/constants/AbiFiles";
import {
  hartContractBinary,
  privHartContractBinary
} from "../src/constants/Binary";

describe("burn 10 token and mint 10 token and save to database", async function() {
  this.timeout(50000);
  let privNet;
  let mainNet;
  let mainAccount;
  let privAccount;

  let mainNetContractAddress;
  let privNetContractAddress;

  let txLog;
  let singleLog;
  let mintAccount;
  let decodedData;

  let joinedBurnID;

  before(async () => {
    mainNet = await new MainNet();
    privNet = await new PrivateNet();
    mainAccount = await mainNet._getAccounts();
    privAccount = await privNet._getAccounts();
  });

  it("check account", () => {
    assert.strictEqual(mainAccount[0], mainNetAccount);
    assert.strictEqual(privAccount[0], privNetAccount);
  });

  it("deploy contract to Mainnet", async () => {
    //deploy hara token contract
    var haratokenContract = await new mainNet.web3.eth.Contract(hartABI);
    await haratokenContract
      .deploy({
        data: hartContractBinary
      })
      .send(
        {
          from: mainAccount[0],
          gas: 4700000
        },
        function(error, transactionHash) {}
      )
      .then(function(newContractInstance) {
        mainNetContractAddress = newContractInstance.options.address;
      });

    assert.strictEqual(typeof mainNetContractAddress, "string");
  });

  it("deploy contract to PrivNet", async () => {
    //deploy hara token priv
    var haratokenContract = await new privNet.web3.eth.Contract(privHartABI);
    await haratokenContract
      .deploy({
        data: privHartContractBinary
      })
      .send(
        {
          from: privAccount[0],
          gas: 4700000
        },
        function(error, transactionHash) {}
      )
      .then(function(newContractInstance) {
        privNetContractAddress = newContractInstance.options.address;
      });

    assert.strictEqual(typeof privNetContractAddress, "string");
  });

  it("test @_initHart and @_burn", async () => {
    await mainNet.haraToken._initHart(hartABI, mainNetContractAddress);
    txLog = await mainNet.haraToken._burn(10, "", mainAccount[0]);

    assert.strictEqual(txLog.events.Burn.address, mainNetContractAddress);

    assert.strictEqual(txLog.events.Burn.event, "Burn");
    assert.strictEqual(txLog.events.Transfer.event, "Transfer");
    assert.strictEqual(txLog.events.BurnLog.event, "BurnLog");
  });

  it("test @_watch start watch", async () => {
    let startBlock = 0;
    let logs = await mainNet.haraToken._watch(
      startBlock,
      mainNetContractAddress,
      [mainNet.haraToken._getTopicMain()],
      false
    );

    singleLog = logs[logs.length - 1];

    assert.strictEqual(singleLog.address, txLog.events.Burn.address);
    assert.strictEqual(singleLog.transactionHash, txLog.transactionHash);
  });

  it("prepare watch data and generate burnid", async () => {
    let startBlock = 0;
    let logs = await mainNet.haraToken._watch(
      startBlock,
      mainNetContractAddress,
      [mainNet.haraToken._getTopicMain()],
      false
    );

    singleLog = logs[logs.length - 1];

    decodedData = await privNet._decodeData(burnLogABI, singleLog.data, singleLog.topics);

    joinedBurnID = await new BlockchainWatcher()._getJoinedBurnID(decodedData.id, "1");

    assert.strictEqual(joinedBurnID.length, 16);
    assert.strictEqual(decodedData.id, "0");
    assert.strictEqual(decodedData.value, "10");
  });

  it("test @_mint", async () => {
    mintAccount = privNet._getMintAccount();
    let nonce = await privNet._getNonce(mintAccount);

    await privNet.haraToken._initHart(privHartABI, privNetContractAddress);
    let mintStatus = await privNet.haraToken._mint(
      decodedData,
      mintAccount,
      privateKey,
      "1",
      nonce
    );

    assert.strictEqual(mintStatus.id, decodedData.id);
    assert.strictEqual(mintStatus.mint_status, "pending");
  });

  it("test @_watch privatenet", async () => {
    await privNet.haraToken._initHart(privHartABI, privNetContractAddress);
    let _blockLogs = await privNet.haraToken._watch(0, privNetContractAddress, [
      privNet.haraToken._getTopicPriv()
    ]);

    let _singleLog = _blockLogs[_blockLogs.length - 1];

    let topics = _singleLog.topics;
    let hashData = _singleLog.data;

    let _decodedData = await privNet._decodeData(mintLogABI, hashData, topics);

    assert.strictEqual(_decodedData.requester, mintSender);
    assert.strictEqual(_decodedData.id, '0');
    assert.strictEqual(_decodedData.value, '10');
  });
});
