// Arquivo: src/database/migrate_workflow.js
// Finalidade: Reestrutura o banco para o fluxo Liga > Rodada > Partida.
// Execute com: node src/database/migrate_workflow.js

import db from './db.js';

console.log("Iniciando a reestruturação do banco de dados para o novo fluxo...");

db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    // 1. Tabela de Rodadas (dias de jogo)
    db.run(`
        CREATE TABLE IF NOT EXISTS rodadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            liga_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'aberta',  -- 'aberta', 'finalizada'
            FOREIGN KEY (liga_id) REFERENCES ligas(id)
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela 'rodadas':", err.message);
        else console.log("Tabela 'rodadas' pronta.");
    });

    // 2. Tabela de Jogadores por Rodada (lista de presença)
    db.run(`
        CREATE TABLE IF NOT EXISTS rodada_jogadores (
            rodada_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            PRIMARY KEY (rodada_id, jogador_id),
            FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela 'rodada_jogadores':", err.message);
        else console.log("Tabela 'rodada_jogadores' pronta.");
    });

    // 3. Tabela de Prêmios da Rodada (MVP e Pé de Rato)
    db.run(`
        CREATE TABLE IF NOT EXISTS premios_rodada (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rodada_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            tipo_premio TEXT NOT NULL, -- 'mvp', 'pe_de_rato'
            pontuacao REAL NOT NULL,
            FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela 'premios_rodada':", err.message);
        else console.log("Tabela 'premios_rodada' pronta.");
    });
    
    // 4. Tabela de Campeonatos (eventos especiais)
    db.run(`
        CREATE TABLE IF NOT EXISTS campeonatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            data TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela 'campeonatos':", err.message);
        else console.log("Tabela 'campeonatos' pronta.");
    });

    // 5. Tabela de Vencedores de Campeonatos
    db.run(`
        CREATE TABLE IF NOT EXISTS campeonato_vencedores (
            campeonato_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            PRIMARY KEY (campeonato_id, jogador_id),
            FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela 'campeonato_vencedores':", err.message);
        else console.log("Tabela 'campeonato_vencedores' pronta.");
    });


    // 6. Ajuste na tabela 'partidas': renomear coluna e adicionar referência
    // Primeiro, tentamos adicionar a coluna 'rodada_id'. Se já existir, ignoramos.
    db.run(`ALTER TABLE partidas ADD COLUMN rodada_id INTEGER REFERENCES rodadas(id)`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
             console.error("Erro ao adicionar coluna 'rodada_id' em 'partidas':", err.message);
        } else {
            console.log("Coluna 'rodada_id' pronta na tabela 'partidas'.");
        }
    });

    db.run('COMMIT;', (err) => {
        if (err) {
            console.error("Erro ao commitar a transação:", err.message);
        } else {
            console.log("Migração concluída com sucesso!");
        }
    });
});

db.close();
