import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Encontra o caminho para o arquivo do banco de dados na raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// O caminho correto é subir 2 níveis a partir de /src/database/
const dbPath = path.join(__dirname, '../../futebol.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conexão principal com o banco de dados estabelecida com sucesso.");
    }
});

// Tratamento para fechar a conexão de forma limpa ao sair do processo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error("Erro ao fechar o banco de dados", err.message);
        }
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});

export default db;
