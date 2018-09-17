import PrivateNet from "./network/PrivateNet.js";
import MainNet from "./network/MainNet.js";

const _controllerDetailContract = async (event, context, callback) => {
  let mainContractAddress = await new MainNet()._getContractAddress();
  let privContractAddress = await new PrivateNet()._getContractAddress();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      mainContractAddress: mainContractAddress,
      privContractAddress: privContractAddress
    })
  });

  return true;
};

const _controllerBurn = async (event, context, callback) => {
  let token = event.queryStringParameters.token;
  let message = event.queryStringParameters.message;

  if(typeof token === "undefined") {
    token = 1;
  }

  if(typeof message === "undefined") {
    message = "";
  }
  
  let status = await new MainNet()._testBurn(token, message);

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      burnStatus: status,
    })
  });

  return true;
}

const _controllerMainTransactionLog = async (event, context, callback) => {
  let status = await new MainNet()._watch(1);

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      burnStatus: status,
    })
  });

  return true;
}

export { _controllerDetailContract, _controllerBurn, _controllerMainTransactionLog };
