// Arquivo: src/database/migrate_final.js
// Finalidade: Adicionar característica de jogador e bônus de defesa.
// Execute com: node src/database/migrate_final.js

import db from './db.js';

console.log("Iniciando migração final do banco de dados...");

db.serialize(() => {
    // 1. Adiciona a coluna 'joga_recuado' na tabela 'jogadores'
    db.run(`ALTER TABLE jogadores ADD COLUMN joga_recuado BOOLEAN NOT NULL DEFAULT 0`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("Erro ao adicionar coluna 'joga_recuado':", err.message);
        } else {
            console.log("Coluna 'joga_recuado' pronta.");
        }
    });

    // 2. Adiciona a coluna 'sem_sofrer_gols' (clean sheet) na tabela 'resultados'
    db.run(`ALTER TABLE resultados ADD COLUMN sem_sofrer_gols BOOLEAN NOT NULL DEFAULT 0`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("Erro ao adicionar coluna 'sem_sofrer_gols':", err.message);
        } else {
            console.log("Coluna 'sem_sofrer_gols' pronta.");
        }
    });
});

db.close();
