import MainNet from "./network/MainNet";
import PrivateNet from "./network/PrivateNet";

export const _MainWatcher = async (event, context, callback) => {
  let result = await new MainNet()._mainWatcher(true)
  
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  });
};

export const _ManualMint = async (event, context, callback) => {
  let burnID = false;
  let networkID = false;

  if(event.queryStringParameters && "burn_id" in event.queryStringParameters) {
    burnID = event.queryStringParameters.burn_id;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({message: "you need burn_id parameter"})
    });
  }

  if(event.queryStringParameters && "network_id" in event.queryStringParameters) {
    networkID = event.queryStringParameters.network_id;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({message: "you need network_id parameter"})
    });
  }

  let result = await new MainNet()._manualMint(burnID, networkID);
  
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  });
}

export const _PrivateWatcher = async (event, context, callback) => {
  const result = await new PrivateNet()._privateWatcher();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  })
}
