const express = require("express");
const cors = require("cors");
const oraclePool = require("./dbconfigs/db");
dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3001;

oraclePool
  .initialize()
  .then(() => {
    app.get("/teste-oracle", async (req, res) => {
      let connection;
      try {
        connection = await oraclePool.getPool().getConnection();
        const result = await connection.execute(
          "SELECT table_name FROM user_tables"
        );
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao consultar Oracle");
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch {}
        }
      }
    });

    app.get("/mpesa-costumers", async (req, res) => {
      let connection;
      try {
        connection = await oraclePool.getPool().getConnection();
        const result = await connection.execute("SELECT * FROM mpesa_customer");
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao consultar Oracle", err);
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch {}
        }
      }
    });

    app.listen(PORT, () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro a iniciar pool Oracle:", err);
    process.exit(1);
  });

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Fecha o pool no Ctrl+C
process.on("SIGINT", async () => {
  console.log("Fechando pool Oracle...");
  await oraclePool.close();
  process.exit(0);
});

// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const oracledb = require("oracledb");
// // const { initialize, oracledb } = require("./dbconfigs/db");
// const { initPool, getPool } = require("./dbconfigs/db");
// const dotenv = require("dotenv");

// dotenv.config();
// const port = process.env.PORT;

// const app = express();

// app.use(express.json());
// app.use(cors());

// const server = http.createServer(app);

// oracledb.initOracleClient({ libDir: "/opt/instantclient-basic-macos" });

// const dbConfig = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   connectString: process.env.DB_CONNECT_STRING,
// };

// async function start() {
//   try {
//     await initPool();

//     app.get('/teste-oracle', async (req, res) => {
//       let connection;
//       try {
//         connection = await getPool().getConnection();
//         const result = await connection.execute('SELECT table_name FROM user_tables');
//         res.json(result.rows);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send('Erro ao conectar à base de dados Oracle');
//       } finally {
//         if (connection) {
//           try {
//             await connection.close();
//           } catch (err) {
//             console.error(err);
//           }
//         }
//       }
//     });

//     app.listen(PORT, () => {
//       console.log(`Servidor a correr em http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error('Erro no start do servidor:', err);
//   }
// }

// // app.get("/teste-oracle", async (req, res) => {
// //   let connection;

// //   try {
// //     connection = await oracledb.getConnection(dbConfig);
// //     const result = await connection.execute(
// //       "SELECT table_name FROM user_tables"
// //     );

// //     res.json(result.rows);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).send("Erro ao conectar à base de dados Oracle");
// //   } finally {
// //     if (connection) {
// //       try {
// //         await connection.close();
// //       } catch (err) {
// //         console.error(err);
// //       }
// //     }
// //   }
// // });

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/users", async (req, res) => {
//   let connection;
//   try {
//     connection = await oracledb.getConnection();
//     const result = await connection.execute("SELECT * FROM users");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Erro na consulta:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error("Erro ao fechar a conexão:", err);
//       }
//     }
//   }
// });

// server.listen(port, () => {
//   // initialize();
//   console.log(`Server is running on http://localhost:${port}`);
// });
