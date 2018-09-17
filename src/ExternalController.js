import fetch from "node-fetch";

const utilHelper = require("./helpers/utilHelper");

const _controllerExternalUrl = async (event, context, callback) => {
    let url = utilHelper.getJsonContent(event.body, "url");
    let resp = await fetch(url);
    let rawResp = await resp.text();

    callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          response: utilHelper.getJsonContent(rawResp)
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

export { _controllerExternalUrl };
