import Upload from "./model/Upload";
import DataFactory from "./contract/DataFactory";
import { dataFactoryABI } from "./constants/AbiFiles";
import { dataFactoryBinary } from "./constants/Binary";
import { mainWeb3, mainProvider, dataFactoryAddress, testAccount, dataProviderAddress } from "./constants/Web3Config";

const pg = require("pg");
const utilHelper = require("./helpers/utilHelper");
const merkle = require("merkle");

const CronJob = require("cron").CronJob;

let client;
let job;

const _cronController = async function(event) {
  let sw = 1;
  if (
    event.queryStringParameters &&
    "switch" in event.queryStringParameters
  ) {
    sw = parseInt(event.queryStringParameters.switch);
  }

  if(typeof sw == "number" && sw > 0 && !job ){
    job = new CronJob("* */1 * * * *", function() {
      if(!client){
        client = new pg.Client({
          user: process.env.PG_USER ? process.env.PG_USER : 'postgres',
          host: process.env.PG_HOST ? process.env.PG_HOST : 'localhost',
          database: process.env.PG_DATABASE ? process.env.PG_DATABASE : 'haraapidev',
          password: process.env.PG_PASSWORD ? process.env.PG_PASSWORD : 'swordfish',
          port: process.env.PG_PORT ? process.env.PG_PORT : 5432,
        });
        client.connect();
      }
      
      const selectData = client.query("select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version, farmer_identity_temp_view.last_version, farmer_identity_temp_view.counter_id, '1' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.is_dumped = '0' and (farmer_identity_view.content <> farmer_identity_temp_view.content or farmer_identity_view.data_id <> farmer_identity_temp_view.data_id or farmer_identity_view.profile_id <> farmer_identity_temp_view.profile_id or farmer_identity_view.is_valid <> farmer_identity_temp_view.is_valid or farmer_identity_view.is_deleted <> farmer_identity_temp_view.is_deleted or farmer_identity_view.gender <> farmer_identity_temp_view.gender or farmer_identity_view.bumdes_id <> farmer_identity_temp_view.bumdes_id or farmer_identity_view.role_id <> farmer_identity_temp_view.role_id or farmer_identity_view.user_id <> farmer_identity_temp_view.user_id or farmer_identity_view.date_of_birth <> farmer_identity_temp_view.date_of_birth or farmer_identity_view.home_address <> farmer_identity_temp_view.home_address or farmer_identity_view.ktp_address <> farmer_identity_temp_view.ktp_address or farmer_identity_view.ktp_number <> farmer_identity_temp_view.ktp_number)", function(err, res) {
        if(!err){
          for(let i = 0 ; i < res.rows.length; ++i){
            let counterId = res.rows[i].counter_id;
            let query = `insert into farmer_identity_temp(id, created_at, updated_at, content, data_id, profile_id, is_valid, is_deleted, current_version, last_version, is_dumped) (select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version + 1, farmer_identity_temp_view.last_version + 1, '0' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.counter_id = ${counterId});`;
            if(res.rows[i].last_version != res.rows[i].current_version){
              query = `insert into farmer_identity_temp(id, created_at, updated_at, content, data_id, profile_id, is_valid, is_deleted, current_version, last_version, is_dumped) (select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version + 1, farmer_identity_temp_view.last_version, '0' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.counter_id = ${counterId});`;
            }
            const insertTemp = client.query(query, function (err2, res2) {
              if(!err2){
                const updateIsDumped = client.query(`update farmer_identity_temp set is_dumped = '1' where counter_id = ${counterId}`, function (err3, res3) {
                  if(!err3){
                    const updateMax = client.query("update farmer_identity_temp set last_version = (select max(last_version) from farmer_identity_temp);", function (err4, res4) {
                      if(!err4){
                        console.log(res4);
                      }
                    });
                  }
                })
              }
            });
          }//end for loop
          const selectTemp = client.query("select * from farmer_identity_temp_view limit 100", async function (err, resp) {
            if(!err){
              let responses = [];
              let dataFactory = new DataFactory(mainWeb3, dataFactoryABI, dataFactoryBinary);
              let initDataFactory = await dataFactory._initDataFactory(dataFactoryABI, dataFactoryAddress);
              let db = new Upload();
              for(let i = 0; i < resp.rows.length; ++i){
                let data = JSON.stringify(resp.rows[i]);
                let endpoint = "*";
                let latestId = resp.rows[i].last_version;
                let dataId = resp.rows[i].id + ":" + resp.rows[i].current_version;
                let networkid = "1";
                let description = "*";
                let uploaderName = "hara";
                let dataName = typeof resp.rows[i].content.imageUri == "undefined" ? "hara" : resp.rows[i].content.imageUri;
                let signature = merkle('sha256').sync([data]).root();
                let timestamp = utilHelper.getIsoDate();
                timestamp += timestamp + "-" + merkle('sha256').sync([dataName]).root();
                let special = await db._getData("SPECIAL", "0000-00-00000:00:00.000Z");
                let insertSpecial;
                let upload;
    
                let transaction = await dataFactory._storeData(testAccount, dataFactoryAddress, dataProviderAddress, signature, "sha3-merkle" );
    
                if(!special){
                  special = await db._initSpecialData();
                }
    
                let item = `{
                  "uploaderName": "${uploaderName}",
                  "id": ${latestId},
                  "networkid": "${networkid}",
                  "dataId": "${dataId}",
                  "dataName": "${dataName}",
                  "description": "${description}",
                  "timestamp": "${timestamp}",
                  "uploaderAddress": "${testAccount}",
                  "contractAddress": "${dataFactoryAddress}",
                  "providerAddress": "${dataProviderAddress}",
                  "transactionHash": "${transaction.transactionHash}",
                  "endpoint": "${endpoint}",
                  "signature": "${signature}",
                  "status": "PENDING",
                  "index": "*"
                }`
              
                //if succeed send transaction to blockchain
                if (typeof transaction.transactionHash !== "undefined"){
                  upload = await db._insertDataByItem(JSON.parse(item));
                }
                
                if(upload){
              
                  let old = "";
                  let x;
                  for (x in special) {
                    if(x.startsWith("index")){
                      old += `"${x}": "${special[x]}", `;
                    }
                  }
              
                  let item = `{
                    "uploaderName": "SPECIAL",
                    "id": 0,
                    "networkid": "*",
                    "dataId": "*",
                    "dataName": "*",
                    "description": "*",
                    "timestamp": "0000-00-00000:00:00.000Z",
                    "uploaderAddress": "*",
                    "contractAddress": "*",
                    "transactionHash": "*",
                    "endpoint": "*",
                    "signature": "*",
                    "status": "PENDING",
                    "index${timestamp}": "${uploaderName}",
                    ${old}}`.replace(", }", "}");
                  insertSpecial = await db._updateSpecialData("SPECIAL", "0000-00-00000:00:00.000Z", "index" + timestamp, uploaderName);
                }
                if(insertSpecial){
                  let response = {
                    responseCode: "0",
                    status: "upload sukses",
                    uploader_name: uploaderName,
                    timestamp,
                    endpoint,
                    signature,
                    transactionHash: transaction.transactionHash
                  }
                  responses.push(response);
                }
              }//end for loop
              //console.log(responses);
            }
          });
          return;
        }
        console.log(err);
      });
    }); //end cron function
    console.log("After job instantiation");
    job.start();
  }else{
    if(job){
      job.stop();
    }//turn off
  }
}

export { _cronController };
