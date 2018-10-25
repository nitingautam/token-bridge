import assert from "assert";
import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import { watcherNetworkAccount, privateKey } from "../src/constants/Web3Config";
import { burnLogABI, hartABI } from "../src/constants/AbiFiles";
import {
  hartContractBinary,
  contractUnitTest
} from "../src/constants/Binary";
import BlockchainWatcher from "../src/model/BlockchainWatcher";
import { privateToAddress, bufferToHex } from "ethereumjs-util";

describe("manual minting", async function() {
  this.timeout(50000);

  let mainNet;
  let privNet;
  let modelBlockChainWatcher;
  let mintAccount;
  let mainAccount;
  let privAccount;

  let watcherContractAddress;
  let privNetContractAddress;

  let singleLog;
  let txLog;

  let decodedData;
  let joinedBurnID;

  before(async () => {
    modelBlockChainWatcher = new BlockchainWatcher();

    mainNet = await new MainNet();
    privNet = await new PrivateNet();
    mainAccount = await mainNet._getAccounts();
    privAccount = await privNet._getAccounts();
  });

  it("check account", async () => {
    let watcherMintAddress = privateToAddress(await privateKey());
    mintAccount = bufferToHex(watcherMintAddress);

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
        console.log("watcherContractAddress", watcherContractAddress);
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
         console.log("privNetContractAddress", privNetContractAddress);
       });
 
     assert.strictEqual(typeof privNetContractAddress, "string");
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
    let nonce = await privNet._getNonce(mintAccount);

    await privNet.haraToken._initHart(hartABI, privNetContractAddress);

    let mintStatus = await privNet.haraToken._mint(
      decodedData,
      mintAccount,
      await privateKey(),
      "4",
      nonce
    );

    assert.strictEqual(mintStatus.id, decodedData.id);
    assert.strictEqual(mintStatus.mint_status, "pending");
  });
});
