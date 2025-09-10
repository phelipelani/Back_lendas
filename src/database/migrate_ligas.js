// Arquivo: src/database/migrate_ligas.js
// Finalidade: Adicionar o sistema de Ligas ao banco de dados.
// Execute com: node src/database/migrate_ligas.js

import db from './db.js';

console.log("Iniciando migração para o sistema de Ligas...");

db.serialize(() => {
    // 1. Cria a nova tabela 'ligas'
    db.run(`
        CREATE TABLE IF NOT EXISTS ligas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            data_inicio TEXT NOT NULL,
            data_fim TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela 'ligas':", err.message);
        } else {
            console.log("Tabela 'ligas' pronta.");
        }
    });

    // 2. Adiciona a coluna 'liga_id' na tabela 'partidas'
    db.run(`ALTER TABLE partidas ADD COLUMN liga_id INTEGER REFERENCES ligas(id)`, (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Coluna 'liga_id' já existe em 'partidas'. Nenhuma ação necessária.");
            } else {
                console.error("Erro ao adicionar coluna 'liga_id' em 'partidas':", err.message);
            }
        } else {
            console.log("Coluna 'liga_id' adicionada à tabela 'partidas' com sucesso!");
        }
    });
});

db.close();
