import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define o caminho para o arquivo do banco de dados na raiz do projeto
const dbPath = path.resolve(__dirname, '..', '..', 'futlendas');

// Cria a conexão com o banco de dados usando a biblioteca sqlite3
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados SQLite:', err.message);
    } else {
        console.log('Conexão com o banco de dados SQLite estabelecida com sucesso.');
    }
});

// Exporta a conexão para ser usada nos Models
export default db;