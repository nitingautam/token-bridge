import BlockchainWatcher from "./model/BlockchainWatcher";

const modelBlockChainWatcher = new BlockchainWatcher();

export const _GetTransactionByAddress = async event => {
  try {
    let data = {
      message: "address not found"
    };

    if (
      event.queryStringParameters &&
      "address" in event.queryStringParameters
    ) {
      let address = event.queryStringParameters.address;

      if (address) {
        let transactions = await modelBlockChainWatcher._getAddressTransaction(
          address
        );

        data = {
          message: "success",
          transactions: transactions
        };
      }
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    };
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const _GetIDTransactions = async (event, callback) => {
  let _get = event.queryStringParameters;

  let networkID = false;
  let burnID = false;

  if (_get && "network_id" in _get) {
    networkID = event.queryStringParameters.network_id;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "you need network_id parameter" })
    });
    return;
  }

  if (_get && "burn_id" in _get) {
    burnID = event.queryStringParameters.burn_id;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "you need burn_id parameter" })
    });
    return;
  }

  const transactions = await modelBlockChainWatcher._getIdTransaction(
    networkID,
    burnID
  );

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: "success", transactions: transactions })
  };
  return response;
};

export const _GetTransactionByDate = async (event, callback) => {
  let _get = event.queryStringParameters;

  let startDate = false;
  let endDate = false;

  if (_get && "start_date" in _get) {
    startDate = event.queryStringParameters.start_date;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "you need start_date parameter" })
    });
    return;
  }

  if (_get && "end_date" in _get) {
    endDate = event.queryStringParameters.end_date;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "you need end_date parameter" })
    });
    return;
  }
  
  const transactions = await modelBlockChainWatcher._getTimestampTransaction(
    startDate,
    endDate
  );

  const response = {
    statusCode: 200,
    body: JSON.stringify({message: "success", transactions: transactions})
  };
  return response;
};

export const _GetTransactionByData = async (event, callback) => {
  let _get = event.queryStringParameters;

  let data = false;

  if (_get && "data" in _get) {
    data = event.queryStringParameters.data;
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "you need data parameter" })
    });
    return;
  }

  var transactions = await modelBlockChainWatcher._getDataTransaction(
   data
  );

  const count = transactions.Count;
  const ScannedCount = transactions.ScannedCount;

  delete(transactions.Count);
  delete(transactions.ScannedCount);

  const response = {
    statusCode: 200,
    body: JSON.stringify({message:"success", count: count, scanned_count: ScannedCount, transactions: transactions})
  };
  return response;
}
