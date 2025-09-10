import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Encontra o caminho para o arquivo do banco de dados na raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../futebol.db');

// Cria uma nova conexão de banco de dados APENAS para este script
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error("Erro ao abrir o banco de dados para setup:", err.message);
    }
    console.log("Conectado ao banco de dados SQLite para configuração.");
});

function setupDatabase() {
    db.serialize(() => {
        console.log("Iniciando configuração do banco de dados...");

        db.run(`CREATE TABLE IF NOT EXISTS jogadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        )`, (err) => {
            if (err) console.error("Erro ao criar tabela jogadores:", err.message);
            else console.log("Tabela 'jogadores' pronta.");
        });

        db.run(`CREATE TABLE IF NOT EXISTS partidas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL
        )`, (err) => {
            if (err) console.error("Erro ao criar tabela partidas:", err.message);
            else console.log("Tabela 'partidas' pronta.");
        });

        db.run(`CREATE TABLE IF NOT EXISTS resultados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partida_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            time TEXT NOT NULL,
            gols INTEGER DEFAULT 0,
            assistencias INTEGER DEFAULT 0,
            vitorias INTEGER DEFAULT 0,
            derrotas INTEGER DEFAULT 0,
            empates INTEGER DEFAULT 0,
            FOREIGN KEY (partida_id) REFERENCES partidas(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )`, (err) => {
            if (err) console.error("Erro ao criar tabela resultados:", err.message);
            else console.log("Tabela 'resultados' pronta.");
        });
    });
}

// Executa a função e fecha a conexão deste script
setupDatabase();
db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Conexão do setup fechada com sucesso.');
});