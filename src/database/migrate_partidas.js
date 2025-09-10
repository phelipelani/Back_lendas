// Ficheiro: src/database/migrate_partidas.js
// Finalidade: Adicionar colunas de resultado e duração à tabela de partidas.
// Execute com: node src/database/migrate_partidas.js

import db from './db.js';

console.log("A atualizar a tabela de partidas...");

db.serialize(() => {
    const queries = [
        `ALTER TABLE partidas ADD COLUMN placar_time1 INTEGER DEFAULT 0`,
        `ALTER TABLE partidas ADD COLUMN placar_time2 INTEGER DEFAULT 0`,
        `ALTER TABLE partidas ADD COLUMN duracao_segundos INTEGER DEFAULT 0`
    ];

    queries.forEach(sql => {
        db.run(sql, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Erro ao adicionar coluna:", err.message);
            } else {
                console.log(`Coluna processada com sucesso.`);
            }
        });
    });
});

db.close();
