// Ficheiro: src/database/migrate_team_tracking.js
// Finalidade: Adicionar colunas para rastrear quais times jogaram em cada partida.
// Execute com: node src/database/migrate_team_tracking.js

import db from './db.js';

console.log("A atualizar a tabela de partidas com rastreamento de times...");

db.serialize(() => {
    const queries = [
        `ALTER TABLE partidas ADD COLUMN time1_numero INTEGER`,
        `ALTER TABLE partidas ADD COLUMN time2_numero INTEGER`
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
