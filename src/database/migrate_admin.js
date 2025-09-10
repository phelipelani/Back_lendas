// Arquivo: src/database/migrate_admin.js
// Finalidade: Adicionar o sistema de Roles (admin/player) ao banco.
// Execute com: node src/database/migrate_admin.js

import db from './db.js';

console.log("Iniciando migração para sistema de Admin...");

db.serialize(() => {
    // Adiciona a coluna 'role' com valor padrão 'player'
    const sql = `ALTER TABLE jogadores ADD COLUMN role TEXT NOT NULL DEFAULT 'player'`;

    db.run(sql, (err) => {
        if (err) {
            // É normal dar erro se a coluna já existe.
            if (err.message.includes("duplicate column name")) {
                console.log("Coluna 'role' já existe. Nenhuma ação necessária.");
            } else {
                console.error("Erro ao adicionar coluna 'role':", err.message);
            }
        } else {
            console.log("Coluna 'role' adicionada com sucesso!");
        }
    });
});

db.close();
