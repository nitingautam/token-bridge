import { privWeb3, defaultMintContractAddress, privateKey, customWeb3Provider, getMultipleMintNetwork } from "../constants/Web3Config";
import HaraToken from "../contract/HaraToken";
import { hartABI } from "../constants/AbiFiles";
import { privateToAddress, bufferToHex } from 'ethereumjs-util';

export default class PrivateNet {
  constructor() {
    this.web3 = privWeb3;
    this.haraToken = new HaraToken(
      this.web3,
      hartABI
    );
  }

  async _initToAnotherNetwork(networkID){
    try {
      let networkData = getMultipleMintNetwork(networkID);
      this.web3 = customWeb3Provider(networkData.url);
      this.haraToken = new HaraToken(
        this.web3,
        hartABI
      );

      await this.haraToken._initHart(hartABI, networkData.contractAddress);

      return networkData.contractAddress;
    } catch (error) {
      console.error("PrivateNet@_initToAnotherNetwork", error.message);
      return false;
    }
  }

  _getContractAddress() {
    return defaultMintContractAddress;
  };

  async _getAccounts() {
    let accountAddress = await this._getMintAccount();
    return [accountAddress];
  };

  async _getMintAccount() {
    let pk = await privateKey();
    let watcherMintAddress = privateToAddress(pk);
    watcherMintAddress = bufferToHex(watcherMintAddress);

    return watcherMintAddress;
  };

  async _getNonce(account) {
    return await this.haraToken._getNonce(account);
  };

  async _mint(data, account, primaryKey, from, nonceSender) {
    let destMintNetwork = data.data;
    let privContractAddress = this._getContractAddress();

    if(destMintNetwork != "") {
      privContractAddress = await this._initToAnotherNetwork(destMintNetwork);
      nonceSender = await this._getNonce(await this._getMintAccount());
    } else {
      await this.haraToken._initHart(hartABI, privContractAddress);
    }

    return await this.haraToken._mint(
      data,
      account,
      primaryKey,
      from,
      nonceSender,
      privContractAddress
    );
  };

}
