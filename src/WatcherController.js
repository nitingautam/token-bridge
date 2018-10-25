import MainNet from "./network/MainNet";

export const _BurnWatcher = async (event, context, callback) => {
  let result = await new MainNet()._burnWatcher(true)
  
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  });
};

export const _ManualMint = async (event, context, callback) => {
  let burnID = false;

  if(event.queryStringParameters && "burn_id" in event.queryStringParameters) {
    burnID = event.queryStringParameters.burn_id;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({message: "you need burn_id parameter"})
    });
  }

  let result = await new MainNet()._manualMint(burnID);
  
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  });
}

export const _MintWatcher = async (event, context, callback) => {
  const result = await new MainNet()._mintWatcher();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({message: "success", mint_data: result})
  })
}
