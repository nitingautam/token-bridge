import assert from "assert";
import MainNet from "../src/network/MainNet";
import {
  hartContractBinary,
  contractUnitTest
} from "../src/constants/Binary";
import { hartABI } from "../src/constants/AbiFiles";
import {
  watcherNetworkAccount, privateKey,
} from "../src/constants/Web3Config";
import PrivateNet from "../src/network/PrivateNet";
import { privateToAddress, bufferToHex } from "ethereumjs-util";

describe("burn 10 token and mint 10 token and save to database", async function() {
  this.timeout(50000);
  let mainNet;
  let tx1Logs;
  let mainAccount;
  let privAccount;
  let privNet;

  let watcherContractAddress;
  let privNetContractAddress;

  before(async () => {
    mainNet = await new MainNet();
    privNet = await new PrivateNet();
    mainAccount = mainNet._getAccounts();
    privAccount = await privNet._getAccounts();
  });

  it("check account", async () => {
    let watcherMintAddress = privateToAddress(await privateKey());
    let mintAccount = bufferToHex(watcherMintAddress);

    assert.strictEqual(mainAccount[0], watcherNetworkAccount);
    assert.strictEqual(privAccount[0], mintAccount);
  });

  it("run deploy contract mainNet and privNet", async () => {
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
        function(error, transactionHash) {
        }
      )
      .then(function(newContractInstance) {
        watcherContractAddress = newContractInstance.options.address;
      });

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

    assert.strictEqual(typeof watcherContractAddress, "string");
    assert.strictEqual(typeof privNetContractAddress, "string");
  });

  it("test @_burn", async () => {
    await mainNet.haraToken._initHart(hartABI, watcherContractAddress);
    tx1Logs = await mainNet.haraToken._burn(10, "", mainAccount[0]);

    assert.strictEqual(
      tx1Logs.events.Burn.address,
      watcherContractAddress
    );

    assert.strictEqual(tx1Logs.events.Burn.event, "Burn");
    assert.strictEqual(tx1Logs.events.Transfer.event, "Transfer");
    assert.strictEqual(tx1Logs.events.BurnLog.event, "BurnLog");
  });
});
