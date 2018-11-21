import Upload from "./model/Upload";
import HaraApiDev from "./model/HaraApiDev";
import DataFactory from "./contract/DataFactory";
import { dataFactoryABI } from "./constants/AbiFiles";
import { dataFactoryBinary } from "./constants/Binary";
import { mainWeb3, mainProvider, dataFactoryAddress, testAccount, dataProviderAddress } from "./constants/Web3Config";
import { PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT } from "./constants/DbConfig";

const pg = require("pg");
const utilHelper = require("./helpers/utilHelper");
const merkle = require("merkle");

const CronJob = require("cron").CronJob;

let haraapidev;
let job;
let cronCounter = 0;

const _cronController = async function(event) {
  let sw = 1;
  if (
    event.queryStringParameters &&
    "switch" in event.queryStringParameters
  ) {
    sw = parseInt(event.queryStringParameters.switch);
  }

  if(typeof sw == "number" && sw > 0 && !job ){
    job = new CronJob("* */1 * * * *", async function() {
      if(!haraapidev){
        haraapidev = new HaraApiDev();
      }

      const selectData = await haraapidev.query("select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version, farmer_identity_temp_view.last_version, farmer_identity_temp_view.counter_id, '1' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.is_dumped = '0' and (farmer_identity_view.content <> farmer_identity_temp_view.content or farmer_identity_view.data_id <> farmer_identity_temp_view.data_id or farmer_identity_view.profile_id <> farmer_identity_temp_view.profile_id or farmer_identity_view.is_valid <> farmer_identity_temp_view.is_valid or farmer_identity_view.is_deleted <> farmer_identity_temp_view.is_deleted or farmer_identity_view.gender <> farmer_identity_temp_view.gender or farmer_identity_view.bumdes_id <> farmer_identity_temp_view.bumdes_id or farmer_identity_view.role_id <> farmer_identity_temp_view.role_id or farmer_identity_view.user_id <> farmer_identity_temp_view.user_id or farmer_identity_view.date_of_birth <> farmer_identity_temp_view.date_of_birth or farmer_identity_view.home_address <> farmer_identity_temp_view.home_address or farmer_identity_view.ktp_address <> farmer_identity_temp_view.ktp_address or farmer_identity_view.ktp_number <> farmer_identity_temp_view.ktp_number)");
      if(selectData.rows && selectData.rows.length > 0){
        for(let i = 0 ; i < selectData.rows.length; ++i){
          let counterId = selectData.rows[i].counter_id;
          let query = `insert into farmer_identity_temp(id, created_at, updated_at, content, data_id, profile_id, is_valid, is_deleted, current_version, last_version, is_dumped) (select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version + 1, farmer_identity_temp_view.last_version + 1, '0' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.counter_id = ${counterId});`;
          if(selectData.rows[i].last_version != selectData.rows[i].current_version){
            query = `insert into farmer_identity_temp(id, created_at, updated_at, content, data_id, profile_id, is_valid, is_deleted, current_version, last_version, is_dumped) (select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version + 1, farmer_identity_temp_view.last_version, '0' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.counter_id = ${counterId});`;
          }
          const insertTemp = await haraapidev.query(query);
          if(insertTemp && insertTemp.rowCount > 0){
            const updateIsDumped = await haraapidev.query(`update farmer_identity_temp set is_dumped = '1' where counter_id = ${counterId}`);
            console.log(updateIsDumped);
            if(updateIsDumped && updateIsDumped.rowCount > 0){
              const updateMax = await haraapidev.query("update farmer_identity_temp set last_version = (select max(last_version) from farmer_identity_temp);");
              console.log(updateMax.rows);
            }
          }
        }//end for loop
      }
      ++cronCounter;
      console.log("process "+ cronCounter +" end -- " + selectData.rows.length + " data updated -- " + utilHelper.getIsoDate());
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
