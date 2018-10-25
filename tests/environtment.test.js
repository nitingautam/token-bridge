import MainNet from "../src/network/MainNet";
import PrivateNet from "../src/network/PrivateNet";
import assert from "assert";
import {
  watcherContractAddress,
  watcherNetworkAccount,
  watcherNetworkURL,
  defaultMintNetworkURL,
  privateKey,
  defaultMintContractAddress
} from "../src/constants/Web3Config";
import { configDB, AWSendpoint } from "../src/constants/DbConfig";
import { privateToAddress, bufferToHex } from "ethereumjs-util";
import { promisify } from "util";
import AWS from "aws-sdk";

describe("environtment test", async function() {
  this.timeout(100000);
  let mainNet;
  let privNet;
  before(async () => {
    mainNet = new MainNet();
    privNet = new PrivateNet();
  });

  it("test Mainnet Provider", () => {
    assert.strictEqual(
      mainNet.web3.eth.currentProvider.host,
      watcherNetworkURL
    );
  });

  it("test PrivateNet Provider", () => {
    assert.strictEqual(
      privNet.web3.eth.currentProvider.host,
      defaultMintNetworkURL
    );
  });

  it("test PrivateKey <is require>", async () => {
    let pk = await privateKey();
    assert.strictEqual(pk.length, 66);
  });

  it("test MainNet@_getContractAddress ", () => {
    assert.strictEqual(mainNet._getContractAddress(), watcherContractAddress);
  });

  it("test target dest default Mint Contract ", () => {
    assert.strictEqual(
      privNet._getContractAddress(),
      defaultMintContractAddress
    );
  });

  it("test MainNet@_getAccounts ", () => {
    assert.strictEqual(mainNet._getAccounts()[0], watcherNetworkAccount);
  });

  it("test target dest default Mint Address", async () => {
    let watcherMintAddress = privateToAddress(await privateKey());
    let defaultMint = bufferToHex(watcherMintAddress);

    assert.strictEqual(await privNet._getMintAccount(), defaultMint);
  });

  it("test db config", () => {
    let config = {};

    if (process.env.IS_DEV) {
      config = {
        region: "local",
        accessKeyId: "not-important",
        secretAccessKey: "not-important",
        endpoint: AWSendpoint,
        credentials: false
      };
    } else {
      config = {
        region: process.env.REGION ? process.env.REGION : "local"
      };
    }

    assert.strictEqual(JSON.stringify(configDB()), JSON.stringify(config));
  });

  it("test privatekey with ssm", async () => {
    const pathSSMParameter = process.env.WATCHER_MINT_PK_PATH;

    if (pathSSMParameter.length > 0) {
      const ssm = new AWS.SSM();
      const getParameterAsync = promisify(ssm.getParameter).bind(ssm);
      const getSsmParameter = async paramsPath => {
        try {
          var params = {
            Name: paramsPath,
            WithDecryption: true
          };
          var value = await getParameterAsync(params);

          if (value && "Parameter" in value) {
            return value.Parameter.Value;
          } else {
            return false;
          }
        } catch (error) {
          console.log("getSSMParameter error path", paramsPath);
          console.log("getSSMParameter error message", error.message);
          return false;
        }
      };

      let pktest = await getSsmParameter(pathSSMParameter);
      let pk = await privateKey();

      if(pktest) {
        assert.strictEqual(pktest, pk);
        assert.strictEqual(pk.substring(0, 2), "0x");
        assert.strictEqual(typeof pk, "string");
      } else {
        assert.strictEqual(pktest, false);
      }
    }
  });
});
