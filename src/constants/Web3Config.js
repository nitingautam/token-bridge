const Web3 = require("web3");

export const mainProvider = process.env.MAIN_NETWORK ? process.env.MAIN_NETWORK : "http://localhost:8545";
export const privProvider = process.env.PRIV_NETWORK ? process.env.PRIV_NETWORK : "http://localhost:8546";

export const privateKey = process.env.MINT_PK ? process.env.MINT_PK : "0x808f2d3173474c6d28381582b1316474d35a7404b25842c3f79985b594370cc1";

export const mintSender = process.env.MINT_SENDER ? process.env.MINT_SENDER : "0x2A4FEB48B3bC241C4bD3b7A9B420683deB572A58";

export const testAccount = process.env.DATA_FACTORY_ACCOUNT ? process.env.DATA_FACTORY_ACCOUNT : "0x2a4feb48b3bc241c4bd3b7a9b420683deb572a58";
export const dataFactoryPrivateKey = process.env.DATA_FACTORY_PK ? process.env.DATA_FACTORY_PK : "0x808f2d3173474c6d28381582b1316474d35a7404b25842c3f79985b594370cc1";
//export const dataFactoryAddress = process.env.DATA_FACTORY_ADDRESS ? process.env.DATA_FACTORY_ADDRESS : "0xf6a21e16167570c7b5cd3c1b06c6cc5849835b2d";
export const dataFactoryAddress = process.env.DATA_FACTORY_ADDRESS ? process.env.DATA_FACTORY_ADDRESS : "0x0fd83765d3803fd895cb1e1fea45c306c01a9fe5";
export const dataProviderAddress = process.env.DATA_PROVIDER_ADDRESS ? process.env.DATA_PROVIDER_ADDRESS : "0x4248fbfba8ee6ad3b9150fcd578174608ee665d6";

export const mainWeb3 = new Web3(new Web3.providers.HttpProvider(mainProvider));
export const privWeb3 = new Web3(new Web3.providers.HttpProvider(privProvider));