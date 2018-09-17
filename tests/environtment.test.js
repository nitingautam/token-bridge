import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import assert from "assert";
import {
  mainNetContractAddress,
  mainNetAccount,
  mainProvider,
  privProvider,
  privateKey,
  privNetContractAddress,
  mintSender
} from "../src/constants/Web3Config";
import { InitDB, configDB } from "../src/constants/DbConfig";

describe("environtment test", async function() {
  let mainNet;
  let privNet;
  before(async () => {
    mainNet = new MainNet();
    privNet = new PrivateNet();
  });

  it("test Mainnet Provider", () => {
    assert.strictEqual(mainNet.web3.eth.currentProvider.host, mainProvider);
  });

  it("test PrivateNet Provider", () => {
    assert.strictEqual(privNet.web3.eth.currentProvider.host, privProvider);
  });

  it("test PrivateKey <is require>", () => {
    assert.strictEqual(privateKey.length, 66);
  });

  it("test MainNet@_getContractAddress ", () => {
    assert.strictEqual(mainNet._getContractAddress(), mainNetContractAddress);
  });

  it("test PrivNet@_getContractAddress ", () => {
    assert.strictEqual(privNet._getContractAddress(), privNetContractAddress);
  });

  it("test MainNet@_getAccounts ", () => {
    assert.strictEqual(mainNet._getAccounts()[0], mainNetAccount);
  });

  it("test PrivNet@_getMintAccount", () => {
    assert.strictEqual(privNet._getMintAccount(), mintSender);
  });

  it("test db config", () => {
    let config = {};

    if (process.env.IS_DEV) {
      config = {
        accessKeyId: "not-important",
        secretAccessKey: "not-important",
        region: "local",
        endpoint: "http://localhost:8000",
        credentials: false
      };
    } else {
      config = {
        accessKeyId: "not-important",
        secretAccessKey: "not-important",
        region: process.env.REGION ? process.env.REGION : "local",
      };
    }

    assert.strictEqual(JSON.stringify(configDB()), JSON.stringify(config));
  });
});
