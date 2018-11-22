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
    job = new CronJob("*/5 * * * * *", async function() {
      if(!haraapidev){
        haraapidev = new HaraApiDev();
      }


      let viewTables = ["farmer_identity"];
      let excludeColumns = [];
      let prefix = "_temp";
      let viewPrefix = "_view";

      let tables = await haraapidev.query(`SELECT tablename FROM pg_catalog.pg_tables where schemaname = 'public' and tablename not like'%_temp'`);
      tables = haraapidev.extractRows(tables.rows, "tablename");

      let tempTables = await haraapidev.query(`SELECT tablename FROM pg_catalog.pg_tables where schemaname = 'public' and tablename like'%_temp'`);
      tempTables = haraapidev.extractRows(tempTables.rows, "tablename");

      let views = await haraapidev.query(`SELECT viewname FROM pg_catalog.pg_views where schemaname = 'public' and viewname not like'%_temp'`);
      views = haraapidev.extractRows(views.rows, "viewname");

      let tempViews = await haraapidev.query(`SELECT viewname FROM pg_catalog.pg_views where schemaname = 'public' and viewname like'%_temp'`);
      tempViews = haraapidev.extractRows(tempViews.rows, "viewname");

      if(viewTables.length == 0){
        viewTables = tables;
      }//if viewtables empty

      for(let i = 0; i < viewTables.length; ++i){
        //check if temp table not been created
        if(tempTables.indexOf(viewTables[i]+prefix) < 0){
          //create and insert temp data process
          let originalColumns = await haraapidev.query(`select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name ='${viewTables[i]}';`);
          let originalColumnsStr = haraapidev.extractRows(originalColumns.rows, "column_name").toString();
          let queryCreateTable = `create table ${viewTables[i]+prefix}(counter_id serial primary key NOT NULL, curr_version integer default 1, last_version integer default 1`;
          if(originalColumns.rows.length > 0){
            queryCreateTable += ","
          }
          for(let j = 0; j < originalColumns.rows.length; ++j){
            queryCreateTable += `${originalColumns.rows[j].column_name} ${originalColumns.rows[j].data_type}${originalColumns.rows[j].character_maximum_length ? `(${originalColumns.rows[j].character_maximum_length})` : ""}`
            if(j != originalColumns.rows.length - 1){
              queryCreateTable += ","
            }
          }
          queryCreateTable += `);`
          
          try{
            let createTable = await haraapidev.query(queryCreateTable);
            let insertData = await haraapidev.query( `insert into ${viewTables[i]+prefix}(${originalColumnsStr}) (select ${originalColumnsStr} from ${viewTables[i]})`);
          }catch(e){
            console.log(e);
          }
        }//end if

        /* let foreignColumn = await haraapidev.queryRecursive([], `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${viewTables[i]}';`);
        //console.log(test);
        let originalColumns = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${viewTables[i]}';`);
        for(let j = 0; j < test.length; ++j){
          let test3 = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${test[j].foreign_table_name}';`);
          for(let k = 0; k < test3.rows.length; ++k){
            test3.rows[k].column_name += "_" + test[j].foreign_table_name;
          }//end inner inner for
          test2.rows = test2.rows.concat(test3.rows);
        }//end inner for
        console.log(test2.rows);
        console.log("length: " + test.length); */
      }//end for

      for(let i = 0; i < viewTables.length; ++i){
        //check if view exist
        if(views.indexOf(viewTables[i]+viewPrefix) < 0){
          //create view process
          let originalColumns = await haraapidev.query(`select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name ='${viewTables[i]}';`);
          let originalColumnsStr = haraapidev.extractRows(originalColumns.rows, "column_name", viewTables[i]+".", viewTables[i]).toString();
          let foreignColumn = await haraapidev.queryRecursive([], `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${viewTables[i]}';`);
          let queryCreateView = `create view ${viewTables[i]+viewPrefix} as select ${originalColumnsStr}`;
          for(let j = 0; j < foreignColumn.length; ++j){
            queryCreateView += ", ";
            let foreignFields = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${foreignColumn[j].foreign_table_name}';`);
            queryCreateView += haraapidev.extractRows(foreignFields.rows, "column_name", foreignColumn[j].foreign_table_name+".", foreignColumn[j].foreign_table_name).toString();
          };
          queryCreateView += ` from ${viewTables[i]}`;
          for(let j = 0; j < foreignColumn.length; ++j){
            queryCreateView += ` inner join ${foreignColumn[j].foreign_table_name} on ${foreignColumn[j].table_name}.${foreignColumn[j].column_name} = ${foreignColumn[j].foreign_table_name}.${foreignColumn[j].foreign_column_name}`;
          }
          console.log(queryCreateView);
        }

        //check if view_temp exist

        //sampai disini terakhir
        
        /* if(tempViews.indexOf(viewTables[i]+viewPrefix+prefix) < 0){
          //create view_temp process
          let originalColumns = await haraapidev.query(`select column_name, data_type, character_maximum_length from INFORMATION_SCHEMA.COLUMNS where table_name ='${viewTables[i]}';`);
          let originalColumnsStr = haraapidev.extractRows(originalColumns.rows, "column_name", viewTables[i]+".", viewTables[i]).toString();
          let foreignColumn = await haraapidev.queryRecursive([], `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${viewTables[i]}';`);
          let queryCreateView = `create view ${viewTables[i]+viewPrefix} as select ${originalColumnsStr}`;
          for(let j = 0; j < foreignColumn.length; ++j){
            queryCreateView += ", ";
            let foreignFields = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${foreignColumn[j].foreign_table_name}';`);
            queryCreateView += haraapidev.extractRows(foreignFields.rows, "column_name", foreignColumn[j].foreign_table_name+".", foreignColumn[j].foreign_table_name).toString();
          };
          queryCreateView += ` from ${viewTables[i]}`;
          for(let j = 0; j < foreignColumn.length; ++j){
            queryCreateView += ` inner join ${foreignColumn[j].foreign_table_name} on ${foreignColumn[j].table_name}.${foreignColumn[j].column_name} = ${foreignColumn[j].foreign_table_name}.${foreignColumn[j].foreign_column_name}`;
          }
          console.log(queryCreateView);
        } */
      }//end for loop

      /* SELECT * FROM pg_catalog.pg_tables where schemaname = 'public'
      SELECT * FROM pg_catalog.pg_views where schemaname = 'public' */






      /* const selectData = await haraapidev.query("select farmer_identity_view.id, farmer_identity_view.created_at, farmer_identity_view.updated_at, farmer_identity_view.content, farmer_identity_view.data_id, farmer_identity_view.profile_id, farmer_identity_view.is_valid, farmer_identity_view.is_deleted, farmer_identity_temp_view.current_version, farmer_identity_temp_view.last_version, farmer_identity_temp_view.counter_id, '1' from farmer_identity_view inner join farmer_identity_temp_view on farmer_identity_view.id = farmer_identity_temp_view.id where farmer_identity_temp_view.is_dumped = '0' and (farmer_identity_view.content <> farmer_identity_temp_view.content or farmer_identity_view.data_id <> farmer_identity_temp_view.data_id or farmer_identity_view.profile_id <> farmer_identity_temp_view.profile_id or farmer_identity_view.is_valid <> farmer_identity_temp_view.is_valid or farmer_identity_view.is_deleted <> farmer_identity_temp_view.is_deleted or farmer_identity_view.gender <> farmer_identity_temp_view.gender or farmer_identity_view.bumdes_id <> farmer_identity_temp_view.bumdes_id or farmer_identity_view.role_id <> farmer_identity_temp_view.role_id or farmer_identity_view.user_id <> farmer_identity_temp_view.user_id or farmer_identity_view.date_of_birth <> farmer_identity_temp_view.date_of_birth or farmer_identity_view.home_address <> farmer_identity_temp_view.home_address or farmer_identity_view.ktp_address <> farmer_identity_temp_view.ktp_address or farmer_identity_view.ktp_number <> farmer_identity_temp_view.ktp_number)");
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
      console.log("----------process "+ cronCounter +" end -- " + selectData.rows.length + " data updated -- " + utilHelper.getIsoDate() + "----------") ; */
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
