// Ficheiro: src/database/migrate_sorteio.js
// Finalidade: Adicionar a tabela para guardar os times sorteados de uma rodada.
// Execute com: node src/database/migrate_sorteio.js

import db from './db.js';

console.log("A adicionar a tabela de times da rodada...");

db.run(`
    CREATE TABLE IF NOT EXISTS rodada_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rodada_id INTEGER NOT NULL,
        jogador_id INTEGER NOT NULL,
        numero_time INTEGER NOT NULL,
        FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
        FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
    )
`, (err) => {
    if (err) {
        console.error("Erro ao criar tabela 'rodada_times':", err.message);
    } else {
        console.log("Tabela 'rodada_times' pronta.");
    }
});

db.close();
