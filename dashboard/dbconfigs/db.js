require("dotenv").config();
const oracledb = require("oracledb");

const dbConfig = {
  user: "devson",
  password: "oracledb",
  connectString: "localhost:1521/XEPDB1",
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
};

let pool;

async function initialize() {
  if (!pool) {
    pool = await oracledb.createPool(dbConfig);
    console.log("Pool Oracle inicializado");
  }
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error("Pool não inicializado");
  }
  return pool;
}

async function close() {
  if (pool) {
    await pool.close();
    console.log("Pool Oracle fechado");
  }
}

module.exports = {
  initialize,
  getPool,
  close,
};
