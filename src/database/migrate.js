// Arquivo: src/database/migrate.js
// Finalidade: Aplicar alterações na estrutura do banco de dados sem apagar dados.
// Execute com: node src/database/migrate.js

import db from './db.js';

console.log("Iniciando migração do banco de dados...");

db.serialize(() => {
    // Adiciona a coluna 'advertencias' na tabela 'resultados' se ela não existir.
    const sql = `ALTER TABLE resultados ADD COLUMN advertencias INTEGER DEFAULT 0`;

    db.run(sql, (err) => {
        if (err) {
            // É normal dar erro se a coluna já existe.
            if (err.message.includes("duplicate column name")) {
                console.log("Coluna 'advertencias' já existe. Nenhuma ação necessária.");
            } else {
                console.error("Erro ao adicionar coluna 'advertencias':", err.message);
            }
        } else {
            console.log("Coluna 'advertencias' adicionada com sucesso!");
        }
    });
});

db.close();
