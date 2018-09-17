import fetch from "node-fetch";

const utilHelper = require("./helpers/utilHelper");
const merkle = require('merkle');

const _uploadController = async (event, context, callback) => {
  let endpoint = utilHelper.getRequestBody("endpoint", event.body, event.headers["Content-Type"]);
  let dataId = utilHelper.getRequestBody("dataId", event.body, event.headers["Content-Type"]);
  let data = utilHelper.getRequestBody("data", event.body, event.headers["Content-Type"]);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      endpoint: endpoint,
      dataId: dataId, 
      hash: merkle('sha256').sync([data]).root(),
      data: data
    })
  });
  return true;

  /* callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        mainContractAddress: mainContractAddress,
        privContractAddress: privContractAddress
      })
    });
    */
};

export { _uploadController };
