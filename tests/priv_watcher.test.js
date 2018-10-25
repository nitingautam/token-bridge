import assert from "assert";
import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import {
  watcherNetworkAccount,
  watcherNetworkID,
  privateKey,
} from "../src/constants/Web3Config";
import BlockchainWatcher from "../src/model/BlockchainWatcher";
import {
  burnLogABI,
  hartABI,
  mintLogABI
} from "../src/constants/AbiFiles";
import {
  hartContractBinary,
  contractUnitTest
} from "../src/constants/Binary";
import { privateToAddress, bufferToHex } from "ethereumjs-util";

describe("burn 10 token and mint 10 token and save to database", async function() {
  this.timeout(50000);
  let privNet;
  let mainNet;
  let mainAccount;
  let privAccount;

  let watcherContractAddress;
  let privNetContractAddress;

  let txLog;
  let singleLog;
  let mintAccount;
  let decodedData;
  let _privateKey;
  let joinedBurnID;

  before(async () => {
    mainNet = await new MainNet();
    privNet = await new PrivateNet();
    mainAccount = await mainNet._getAccounts();
    privAccount = await privNet._getAccounts();

    _privateKey = await privateKey();
  });

  it("check account", async () => {
    let watcherMintAddress = privateToAddress(await privateKey());
    let mintAccount = bufferToHex(watcherMintAddress);

    assert.strictEqual(mainAccount[0], watcherNetworkAccount);
    assert.strictEqual(privAccount[0], mintAccount);
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
        watcherContractAddress = newContractInstance.options.address;
      });

    assert.strictEqual(typeof watcherContractAddress, "string");
  });

  it("deploy contract to PrivNet", async () => {
    //deploy hara token priv
    var haratokenContract = await new privNet.web3.eth.Contract(hartABI);
    await haratokenContract
      .deploy({
        data: contractUnitTest
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
    await mainNet.haraToken._initHart(hartABI, watcherContractAddress);
    txLog = await mainNet.haraToken._burn(10, "", mainAccount[0]);

    assert.strictEqual(txLog.events.Burn.address, watcherContractAddress);

    assert.strictEqual(txLog.events.Burn.event, "Burn");
    assert.strictEqual(txLog.events.Transfer.event, "Transfer");
    assert.strictEqual(txLog.events.BurnLog.event, "BurnLog");
  });

  it("test @_watch start watch", async () => {
    let startBlock = 0;
    let logs = await mainNet.haraToken._watch(
      startBlock,
      watcherContractAddress,
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
      watcherContractAddress,
      [mainNet.haraToken._getTopicMain()],
      false
    );

    singleLog = logs[logs.length - 1];

    decodedData = await mainNet._decodeData(burnLogABI, singleLog.data, singleLog.topics, watcherContractAddress);

    joinedBurnID = await new BlockchainWatcher()._getJoinedBurnID(decodedData.id, "1");

    assert.strictEqual(joinedBurnID.length, 16);
    assert.strictEqual(decodedData.id, "0");
    assert.strictEqual(decodedData.value, "10");
  });

  it("test @_mint", async () => {
    mintAccount = await privNet._getMintAccount();
    let nonce = await privNet._getNonce(mintAccount);

    await privNet.haraToken._initHart(hartABI, privNetContractAddress);
    let mintStatus = await privNet.haraToken._mint(
      decodedData,
      mintAccount,
      _privateKey,
      watcherNetworkID,
      nonce
    );

    assert.strictEqual(mintStatus.id, decodedData.id);
    assert.strictEqual(mintStatus.mint_status, "pending");
  });

  it("test @_watch privatenet", async () => {
    await privNet.haraToken._initHart(hartABI, privNetContractAddress);
    let _blockLogs = await privNet.haraToken._watch(0, privNetContractAddress, [
      privNet.haraToken._getTopicPriv()
    ]);

    let _singleLog = _blockLogs[_blockLogs.length - 1];

    let topics = _singleLog.topics;
    let hashData = _singleLog.data;

    let _decodedData = await mainNet._decodeData(mintLogABI, hashData, topics, privNetContractAddress);

    assert.strictEqual(_decodedData.requester.toLowerCase(), privAccount[0]);
    assert.strictEqual(_decodedData.id, '0');
    assert.strictEqual(_decodedData.value, '10');
  });
});
