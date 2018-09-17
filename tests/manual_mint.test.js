import assert from "assert";
import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import { mintSender, privateKey, privNetContractAddress, mainNetAccount, privNetAccount } from "../src/constants/Web3Config";
import { burnLogABI, hartABI, privHartABI } from "../src/constants/AbiFiles";
import {
  hartContractBinary,
  privHartContractBinary
} from "../src/constants/Binary";
import BlockchainWatcher from "../src/model/BlockchainWatcher";

describe("manual minting", async function() {
  this.timeout(50000);

  let mainNet;
  let privNet;
  let modelBlockChainWatcher;
  let mintAccount;
  let mainAccount;
  let privAccount;

  let mainNetContractAddress;
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

    assert.strictEqual(
      txLog.events.Burn.address,
      mainNetContractAddress
    );

    assert.strictEqual(txLog.events.Burn.event, "Burn");
    assert.strictEqual(txLog.events.Transfer.event, "Transfer");
    assert.strictEqual(txLog.events.BurnLog.event, "BurnLog");
  });

  it("test @_getMintAccount on PrivateNet", async () => {
    mintAccount = privNet._getMintAccount();

    assert.strictEqual(mintAccount, mintSender);
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
});
