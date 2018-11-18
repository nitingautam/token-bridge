const pg = require("pg");

export default class HaraApiDev {
  constructor() {
    this.client = new pg.Client({
      user: "postgres",
      host: "localhost",
      database: "haraapidev",
      password: "swordfish",
      port: 5432
    });
    this.client.connect();
  }

  async query(q){
      let r = await this.client.query(q);
      return r;
  }
}
