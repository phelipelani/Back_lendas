// Arquivo: src/database/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ADICIONE ESTA LINHA PARA FORÇAR A CONEXÃO SSL
    ssl: { rejectUnauthorized: false }
  });

  console.log("Conexão com o banco de dados MySQL (Cloud SQL) estabelecida com sucesso.");

} catch (error) {
  console.error("Erro ao conectar com o banco de dados MySQL:", error);
  process.exit(1);
}

export default pool;