import {
  _uploadWatchController,
} from "./src/UploadController";

import {
  _cronController
} from "./src/CronController"

const _uploadWatch = (event, context, callback) => {
  return _uploadWatchController(event, context, callback);
};

const _activateCron = (event, context, callback) => {
  return _cronController(event, context, callback);
};
_activateCron({queryStringParameters: {switch: 1}}, null, null);