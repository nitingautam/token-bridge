import './require-babel-polyfill';
import {
  _controllerDetailContract,
  _controllerBurn
} from "./src/ContractController.js";
import { _uploadController } from "./src/UploadController";
import { _controllerExternalUrl } from "./src/ExternalController";
import {
  _ManualMint,
  _BurnWatcher,
  _MintWatcher
} from "./src/WatcherController.js";
import {
  _GetTransactionByAddress,
  _GetIDTransactions,
  _GetTransactionByDate,
  _GetTransactionByData,
  _GetTotalSupply
} from "./src/TransactionController.js";

const _burnWatcher = async (event, context, callback) => {
  return await _BurnWatcher(event, context, callback);
}
;
const _mintWatcher = (event, context, callback) => {
  return _MintWatcher(event, context, callback);
};

const _getContractAddress = async (event, context, callback) => {
  return _controllerDetailContract(event, context, callback);
};

const _getTestBurn = (event, context, callback) => {
  return _controllerBurn(event, context, callback);
};

const _postManualMint = (event, context, callback) => {
  return _ManualMint(event, context, callback);
};

const _externalRequest = (event, context, callback) => {
  return _controllerExternalUrl(event, context, callback);
};

const _uploadData = (event, context, callback) => {
  return _uploadController(event, context, callback);
};

const _getAddressTransaction = async (event, context, callback) => {
  return _GetTransactionByAddress(event);
};

const _getIDTransaction = async (event, context, callback) => {
  return _GetIDTransactions(event, callback);
};

const _getTimestampTransaction = async (event, context, callback) => {
  return _GetTransactionByDate(event, callback);
};

const _getDataTransaction = async (event, context, callback) => {
  return _GetTransactionByData(event, callback);
};

const _getTotalSupply = async (event, context, callback) => {
  return _GetTotalSupply(event, callback);
}

export {
  _getAddressTransaction,
  _getTimestampTransaction,
  _getIDTransaction,
  _getDataTransaction,
  _getContractAddress,
  _getTestBurn,
  _externalRequest,
  _postManualMint,
  _uploadData,
  _burnWatcher,
  _mintWatcher,
  _getTotalSupply,
};
