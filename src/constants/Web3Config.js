import Web3 from "web3";

export const mainProvider = process.env.MAIN_NETWORK ? process.env.MAIN_NETWORK : "http://ganache_main:8545";
export const privProvider = process.env.PRIV_NETWORK ? process.env.PRIV_NETWORK : "http://ganache_priv:8546";
export const privateKey = process.env.MINT_PK ? process.env.MINT_PK : "0x808f2d3173474c6d28381582b1316474d35a7404b25842c3f79985b594370cc1";

export const mainWeb3 = new Web3(new Web3.providers.HttpProvider(mainProvider));
export const privWeb3 = new Web3(new Web3.providers.HttpProvider(privProvider));

export const mainNetAccount = process.env.MAIN_NETWORK_ACCOUNT ? process.env.MAIN_NETWORK_ACCOUNT : "0x2A4FEB48B3bC241C4bD3b7A9B420683deB572A58";
export const privNetAccount = process.env.PRIV_NETWORK_ACCOUNT ? process.env.PRIV_NETWORK_ACCOUNT : "0x2A4FEB48B3bC241C4bD3b7A9B420683deB572A58";

export const mainNetContractAddress = process.env.HART_MAIN_ADDRESS ? process.env.HART_MAIN_ADDRESS : false;
export const privNetContractAddress = process.env.HART_PRIV_ADDRESS ? process.env.HART_PRIV_ADDRESS : false;

export const mintSender = process.env.MINT_SENDER ? process.env.MINT_SENDER : "0x2A4FEB48B3bC241C4bD3b7A9B420683deB572A58";