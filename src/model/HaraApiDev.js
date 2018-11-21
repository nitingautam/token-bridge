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
}
