"use strict";
import {
  _controllerDetailContract,
  _controllerBurn
} from "./src/ContractController.js";
import { _uploadController } from "./src/UploadController";
import { _controllerExternalUrl } from "./src/ExternalController";
import {
  _MainWatcher,
  _ManualMint,
  _PrivateWatcher
} from "./src/WatcherController.js";
import {
  _GetTransactionByAddress,
  _GetIDTransactions,
  _GetTransactionByDate,
  _GetTransactionByData
} from "./src/TransactionController.js";

const _mainWatcher = async (event, context, callback) => {
  return await _MainWatcher(event, context, callback);
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

const _privWatcher = (event, context, callback) => {
  return _PrivateWatcher(event, context, callback);
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

export {
  _getAddressTransaction,
  _getTimestampTransaction,
  _getIDTransaction,
  _getDataTransaction,
  _getContractAddress,
  _getTestBurn,
  _externalRequest,
  _mainWatcher,
  _privWatcher,
  _postManualMint,
  _uploadData
};
