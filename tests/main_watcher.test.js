import MainNet from "../src/network/MainNet";
import assert from "assert";
import BlockchainWatcherBlock from "../src/model/BlockchainWatcherBlock";
import { hartABI, burnLogABI } from "../src/constants/AbiFiles";
import { hartContractBinary } from "../src/constants/Binary";
import { watcherNetworkAccount, watcherNetworkID, privateKey } from "../src/constants/Web3Config";
import PrivateNet from "../src/network/PrivateNet";
import BlockchainWatcher from "../src/model/BlockchainWatcher";
import { privateToAddress, bufferToHex } from "ethereumjs-util";

describe("when mainwatcher got new data and dont have new data", async function() {
  this.timeout(1000000);
  let mainNet;
  let privNet;
  let mainAccount;

  let watcherContractAddress;

  let mintAccount;

  let singleLog;

  let txLog;

  let decodedData;

  let genBurnItem;

  let accountPrivNonce;

  before(async () => {
    mainNet = await new MainNet();
    privNet = await new PrivateNet();
    mainAccount = await mainNet._getAccounts();
  });

  it("check account", () => {
    assert.strictEqual(mainAccount[0], watcherNetworkAccount);
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

  it("test @_getMintAccount", async () => {
    mintAccount = await privNet._getMintAccount();

    let watcherMintAddress = privateToAddress(await privateKey());
    let _mintAccount = bufferToHex(watcherMintAddress);

    assert.strictEqual(mintAccount, _mintAccount);
  });

  it("test @_initHart and @_burn", async () => {
    await mainNet.haraToken._initHart(hartABI, watcherContractAddress);
    txLog = await mainNet.haraToken._burn(10, "", mainAccount[0]);

    assert.strictEqual(
      txLog.events.Burn.address,
      watcherContractAddress
    );

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

  it("test @_decodeData", async () => {
    decodedData = await mainNet._decodeData(burnLogABI, singleLog.data, singleLog.topics, watcherContractAddress);

    assert.strictEqual(mainAccount[0], decodedData.burner);
  });

  it("test @_generateBurnItem to save into dynamodb", async () => {
    genBurnItem = await new BlockchainWatcher()._generateBurnItem(singleLog, decodedData, 0, watcherNetworkID);

    assert.strictEqual(genBurnItem.from, "0004");
    assert.strictEqual(genBurnItem.to, "0005");
    assert.strictEqual(genBurnItem.mint_status, "false");
    assert.strictEqual(genBurnItem.burn_status, "true");
    assert.strictEqual(genBurnItem.hart_value, 10);
  });

  it("test @_getNonce on PrivateNet", async () => {
    accountPrivNonce = await privNet._getNonce(mintAccount);

    assert.strictEqual(typeof accountPrivNonce, "number");
  });
});
