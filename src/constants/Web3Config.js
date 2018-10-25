import Web3 from "web3";
import { promisify } from "util";
import AWS from "aws-sdk";

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

const pathSSMParameter = process.env.WATCHER_MINT_PK_PATH;

export const watcherNetworkURL = process.env.WATCHER_NETWORK_URL
  ? process.env.WATCHER_NETWORK_URL
  : "http://ganache_main:8545";
export const defaultMintNetworkURL = process.env.DEFAULT_MINT_NETWORK_URL
  ? process.env.DEFAULT_MINT_NETWORK_URL
  : "http://ganache_priv:8546";

export const privateKey = async () => {
  try {
    let pk = await getSsmParameter(pathSSMParameter);

    if (!pk) {
      return process.env.WATCHER_MINT_PK;
    } else {
      return pk;
    }
  } catch (error) {
    console.log("get SSM error", error.message);
    return process.env.WATCHER_MINT_PK;
  }
};

export const watcherNetwork = new Web3(
  new Web3.providers.HttpProvider(watcherNetworkURL)
);
export const privWeb3 = new Web3(
  new Web3.providers.HttpProvider(defaultMintNetworkURL)
);

export const customWeb3Provider = providerHTTPURL => {
  return new Web3(new Web3.providers.HttpProvider(providerHTTPURL));
};

export const watcherNetworkAccount = process.env.WATCHER_NETWORK_ACCOUNT
  ? process.env.WATCHER_NETWORK_ACCOUNT
  : "0x2A4FEB48B3bC241C4bD3b7A9B420683deB572A58";

export const watcherContractAddress = process.env.WATCHER_CONTRACT_ADDRESS
  ? process.env.WATCHER_CONTRACT_ADDRESS
  : false;

const watcherNID = () => {
  let networkID = process.env.WATCHER_NETWORK_ID
    ? process.env.WATCHER_NETWORK_ID
    : false;

  if (networkID) {
    return networkID.toString();
  }

  return false;
};

const defaultMintNID = () => {
  let networkID = process.env.DEFAULT_MINT_NETWORK_ID
    ? process.env.DEFAULT_MINT_NETWORK_ID
    : false;

  if (networkID) {
    return networkID.toString();
  }

  return false;
};

export const watcherNetworkID = watcherNID();
export const defaultMintNetworkID = defaultMintNID();
export const defaultMintContractAddress =
  process.env.DEFAULT_MINT_CONTRACT_ADDRESS;

// this is multiple config minting
const multipleMintNetworkID = JSON.parse(process.env.MULTIPLE_MINT_NETWORK_ID);
const multipleMintNetworkURL = JSON.parse(
  process.env.MULTIPLE_MINT_NETWORK_URL
);
const multipleMintContractAddress = JSON.parse(
  process.env.MULTIPLE_MINT_CONTRACT_ADDRESS
);

export const getMultipleMintNetwork = (networkID = false) => {
  let network = {};

  multipleMintNetworkID.map((val, key) => {
    network = {
      ...network,
      [val]: {
        id: val,
        url: multipleMintNetworkURL[key],
        contractAddress: multipleMintContractAddress[key]
      }
    };
  });

  if (!networkID) {
    return network;
  }

  return network[networkID];
};
