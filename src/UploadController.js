import Upload from "./model/Upload";
import DataFactory from "./contract/DataFactory";
import { dataFactoryABI } from "./constants/AbiFiles";
import { dataFactoryBinary } from "./constants/Binary";
import { mainWeb3, mainProvider, dataFactoryAddress, dataProviderAddress, testAccount } from "./constants/Web3Config";
import { DEFAULT_GET_LIMIT } from "./constants/UploadWatcherConfig";
import utilHelper from "./helpers/utilHelper";

const merkle = require('merkle');

const corsHeader = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  }
};

const _uploadWatchController  = async function(event, context, callback) {
  let dataFactory = new DataFactory(mainWeb3, dataFactoryABI, "");
  let db = new Upload();
  let result = [];
  let updatedData = 0;
  let counter = 0;

  let pendingData = await db._getData("SPECIAL", "0000-00-00000:00:00.000Z");
  if(!pendingData){
    pendingData = await db._initSpecialData();
  }

  let x;
  for (x in pendingData) {
    if(x.startsWith("index") && pendingData[x] ){
      if(counter >= DEFAULT_GET_LIMIT){
        break;
      }
      //get tx receipt, if not null then transaction is mined
      let currentData = await db._getData(pendingData[x], x.replace("index", ""));
      let txReceipt = await dataFactory._watch(currentData.transactionHash);
      let update;
      let updateSpecial;
      if(txReceipt && typeof txReceipt.transactionHash !== "undefined"){
        update = await db._updatePendingData(pendingData[x], x.replace("index", ""));
        updateSpecial = await db._removeSpecialColumn("SPECIAL", "0000-00-00000:00:00.000Z", x);
      }
      if(update && updateSpecial){
        result.push(update);
        ++updatedData;
      }
      ++counter;
    }
  }//end for loop

  let status = "tidak ada data yang pending";
  if(updatedData){
    status = "proses update data sukses";
  }

  let response = {
    responseCode: "0",
    status,
    count: updatedData,
    items: result,
  }

  utilHelper.log(response);

  callback(null, {
    ...corsHeader,
    statusCode: 200,
    body: JSON.stringify(response)
  });
};

export { _uploadWatchController };
