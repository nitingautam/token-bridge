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

//data for dynamic query
let viewTables = [];
let excludeTables = [];
let excludeColumns = [];
let prefix = "_temp";
let viewPrefix = "_view";

const _cronController = async function(event) {
  let sw = 1;
  if (
    event.queryStringParameters &&
    "switch" in event.queryStringParameters
  ) {
    sw = parseInt(event.queryStringParameters.switch);
  }

  if(typeof sw == "number" && sw > 0 && !job ){
    job = new CronJob("*/10 * * * * *", async function() {
      if(!haraapidev){
        haraapidev = new HaraApiDev();
      }      

      //data initialize
      let tables = await haraapidev.query(`SELECT tablename FROM pg_catalog.pg_tables where schemaname = 'public' and tablename not like'%_temp';`);
      tables = haraapidev.extractRows(tables.rows, "tablename");

      let tempTables = await haraapidev.query(`SELECT tablename FROM pg_catalog.pg_tables where schemaname = 'public' and tablename like'%_temp';`);
      tempTables = haraapidev.extractRows(tempTables.rows, "tablename");

      let views = await haraapidev.query(`SELECT viewname FROM pg_catalog.pg_views where schemaname = 'public' and viewname not like'%_temp';`);
      views = haraapidev.extractRows(views.rows, "viewname");

      let tempViews = await haraapidev.query(`SELECT viewname FROM pg_catalog.pg_views where schemaname = 'public' and viewname like'%_temp';`);
      tempViews = haraapidev.extractRows(tempViews.rows, "viewname");

      let fkNames = await haraapidev.query(`SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY';`);
      fkNames = haraapidev.extractRows(fkNames.rows, "constraint_name");

      if(viewTables.length == 0){
        viewTables = tables;
      }//if viewtables empty

      //loop for creating temp tables
      for(let i = 0; i < viewTables.length; ++i){
        if(excludeTables.indexOf(viewTables[i]) >=0 ){
          continue;
        }
        if(tempTables.indexOf(viewTables[i]+prefix) >= 0){
          continue;
        }
        //create and insert to table temp
        let createTableTemp = await haraapidev.query(`CREATE TABLE ${viewTables[i]+prefix} AS SELECT * FROM ${viewTables[i]};`);
        let alterAddCounter = await haraapidev.query(`alter table ${viewTables[i]+prefix} add counter_id serial primary key NOT NULL;`);
        let alterAddcurrVer = await haraapidev.query(`alter table ${viewTables[i]+prefix} add curr_version integer default 1;`);
        let alterAddlastVer = await haraapidev.query(`alter table ${viewTables[i]+prefix} add last_version  integer default 1;`);
      }//end for

      //loop for creating views
      for(let i = 0; i < viewTables.length; ++i){
        if(excludeTables.indexOf(viewTables[i]) >=0 ){
          continue;
        }
        if(views.indexOf(viewTables[i]+viewPrefix) >= 0){
          continue;
        }
        let pushedColumns = [];
        let queryCreateView = `create view ${viewTables[i]+viewPrefix} as select ${viewTables[i]}.*`;
        let queryCreateViewTemp = `create view ${viewTables[i]+viewPrefix+prefix} as select ${viewTables[i]+prefix}.*`;
        let foreignColumn = await haraapidev.queryRecursive([], `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${viewTables[i]}';`);
        for(let j = 0; j < foreignColumn.length; ++j){
          if(pushedColumns.indexOf( foreignColumn[j].foreign_table_name ) >=0){
            continue;
          }
          pushedColumns.push(foreignColumn[j].foreign_table_name);
          let foreignFields = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${foreignColumn[j].foreign_table_name}';`);
          let foreignFieldsTemp = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${foreignColumn[j].foreign_table_name+prefix}';`);
          let extractedForeign = haraapidev.extractRows(foreignFields.rows, "column_name", foreignColumn[j].foreign_table_name+".", foreignColumn[j].foreign_table_name).toString();
          let extractedForeignTemp = haraapidev.extractRows(foreignFieldsTemp.rows, "column_name", foreignColumn[j].foreign_table_name+prefix+".", foreignColumn[j].foreign_table_name).toString();
          queryCreateView += ", " + extractedForeign;
          queryCreateViewTemp += ", " + extractedForeignTemp;
        }//end inner for
        queryCreateView += ` from ${viewTables[i]}`;
        queryCreateViewTemp += ` from ${viewTables[i]+prefix}`;
        pushedColumns = [];
        for(let j = 0; j < foreignColumn.length; ++j){
          if(pushedColumns.indexOf( foreignColumn[j].foreign_table_name ) >=0){
            continue;
          }
          pushedColumns.push(foreignColumn[j].foreign_table_name);
          queryCreateView += ` inner join ${foreignColumn[j].foreign_table_name} on ${foreignColumn[j].table_name}.${foreignColumn[j].column_name} = ${foreignColumn[j].foreign_table_name}.${foreignColumn[j].foreign_column_name};`;
          queryCreateViewTemp += ` inner join ${foreignColumn[j].foreign_table_name+prefix} on ${foreignColumn[j].table_name+prefix}.${foreignColumn[j].column_name} = ${foreignColumn[j].foreign_table_name+prefix}.${foreignColumn[j].foreign_column_name};`;
        }//end inner for

        await haraapidev.query(queryCreateView);
        await haraapidev.query(queryCreateViewTemp);
      }//end for

      //loop for versioning
      for(let i = 0; i < viewTables.length; ++i){
        let col = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = '${viewTables[i]}';`);
        console.log(col);
        //last is here
      }//end outer loop

      /* //loop for creating temp views
      for(let i = 0; i < viewTables.length; ++i){
        if(excludeTables.indexOf(viewTables[i]) >=0 ){
          continue;
        }
        if(tempViews.indexOf(viewTables[i]+viewPrefix+prefix) >= 0){
          continue;
        }
        let pushedColumns = [];
        let queryCreateView = `create view ${viewTables[i]+viewPrefix+prefix} as select ${viewTables[i]+prefix}.*`;
        let foreignColumn = await haraapidev.queryRecursive([], `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${viewTables[i]}';`);
        for(let j = 0; j < foreignColumn.length; ++j){
          if(pushedColumns.indexOf( foreignColumn[j].foreign_table_name ) >=0){
            continue;
          }
          pushedColumns.push(foreignColumn[j].foreign_table_name);
          let foreignFields = await haraapidev.query(`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name ='${foreignColumn[j].foreign_table_name}';`);
          queryCreateView += ", " + haraapidev.extractRows(foreignFields.rows, "column_name", foreignColumn[j].foreign_table_name+".", foreignColumn[j].foreign_table_name).toString();
        }//end inner for
        queryCreateView += ` from ${viewTables[i]}`;
        pushedColumns = [];
        for(let j = 0; j < foreignColumn.length; ++j){
          if(pushedColumns.indexOf( foreignColumn[j].foreign_table_name ) >=0){
            continue;
          }
          pushedColumns.push(foreignColumn[j].foreign_table_name);
          queryCreateView += ` inner join ${foreignColumn[j].foreign_table_name} on ${foreignColumn[j].table_name}.${foreignColumn[j].column_name} = ${foreignColumn[j].foreign_table_name}.${foreignColumn[j].foreign_column_name}`;
        }//end inner for
        await haraapidev.query(queryCreateView);
      }//end for */



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
