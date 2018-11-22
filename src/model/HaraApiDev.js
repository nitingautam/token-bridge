import {
  PG_USER,
  PG_HOST,
  PG_DATABASE,
  PG_PASSWORD,
  PG_PORT
} from "../constants/DbConfig";
const pg = require("pg");

export default class HaraApiDev {
  constructor() {
    this.client = new pg.Client({
      user: PG_USER,
      host: PG_HOST,
      database: PG_DATABASE,
      password: PG_PASSWORD,
      port: PG_PORT
    });
    this.client.connect();
  }

  async query(q) {
    let r = await this.client.query(q);
    return r;
  }

  async queryRecursive(dat, q) {
    let r = await this.client.query(q);
    if(r.rows.length > 0){
      dat = dat.concat(r.rows);
      for(let i = 0 ; i < r.rows.length; ++i){
        if(q.search(r.rows[i].table_name) > 0){
          dat = await this.queryRecursive(dat, q.replace(r.rows[i].table_name, r.rows[i].foreign_table_name));
        }
      }
    }
    return dat;
  }

  extractRows(result, fieldName, suffix = "", withAs = ""){
    let dat = [];
    for(let i = 0; i < result.length; ++i){
      dat.push(withAs ? suffix+result[i][fieldName]+` as ${result[i][fieldName]+'_'+withAs}` : suffix+result[i][fieldName]);
    }
    return dat;
  }

}
