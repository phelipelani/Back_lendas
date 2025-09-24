// Arquivo: src/database/migrate_gol_contra.js
import db from './db.js';

console.log("Iniciando migração: Adicionando 'gols_contra'...");

db.serialize(() => {
    const sql = `ALTER TABLE resultados ADD COLUMN gols_contra INTEGER DEFAULT 0`;

    db.run(sql, (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Coluna 'gols_contra' já existe. Nenhuma ação necessária.");
            } else {
                console.error("Erro ao adicionar coluna 'gols_contra':", err.message);
            }
        } else {
            console.log("Coluna 'gols_contra' adicionada com sucesso à tabela 'resultados'!");
        }
    });
});

db.close();