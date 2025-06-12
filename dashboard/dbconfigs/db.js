const oracledb = require("oracledb");
require("dotenv").config();

async function initialize() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });
    console.log("Conexão com Oracle estabelecida");
  } catch (err) {
    console.error("Erro ao conectar ao Oracle:", err);
    process.exit(1);
  }
}

module.exports = { initialize, oracledb };
