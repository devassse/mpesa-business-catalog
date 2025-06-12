const express = require("express");
const cors = require("cors");
const http = require("http");
const { initialize, oracledb } = require("./dbconfigs/db");
const dotenv = require("dotenv");

dotenv.config();
const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/users", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro na consulta:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar a conexão:", err);
      }
    }
  }
});

server.listen(port, () => {
  initialize();
  console.log(`Server is running on http://localhost:${port}`);
});
