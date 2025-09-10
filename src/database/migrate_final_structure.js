// Arquivo: src/database/migrate_final_structure.js
// Finalidade: Prepara TODO o banco de dados com a estrutura final.
// Execute UMA ÚNICA VEZ com: node src/database/migrate_final_structure.js

import db from './db.js';

console.log("Iniciando a configuração final e definitiva do banco de dados...");

const runQuery = (sql, description) => {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                // Ignora o erro se a coluna/tabela já existe, que é esperado em execuções repetidas.
                if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
                    console.log(`- ${description}: Já existe, pulando.`);
                    resolve();
                } else {
                    console.error(`Erro ao executar: ${description}`, err.message);
                    reject(err);
                }
            } else {
                console.log(`+ ${description}: Criado/Adicionado com sucesso.`);
                resolve();
            }
        });
    });
};

db.serialize(async () => {
    await runQuery('BEGIN TRANSACTION;', 'Iniciando transação');

    // --- Tabela Jogadores ---
    await runQuery(`ALTER TABLE jogadores ADD COLUMN role TEXT NOT NULL DEFAULT 'player'`, 'Coluna role em jogadores');
    await runQuery(`ALTER TABLE jogadores ADD COLUMN joga_recuado BOOLEAN NOT NULL DEFAULT 0`, 'Coluna joga_recuado em jogadores');
    await runQuery(`ALTER TABLE jogadores ADD COLUMN nivel INTEGER NOT NULL DEFAULT 1`, 'Coluna nivel em jogadores');

    // --- Tabela Ligas ---
    await runQuery(`
        CREATE TABLE IF NOT EXISTS ligas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            data_inicio TEXT NOT NULL,
            data_fim TEXT NOT NULL
        )
    `, 'Tabela ligas');

    // --- Tabela Rodadas ---
    await runQuery(`
        CREATE TABLE IF NOT EXISTS rodadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            liga_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'aberta',
            FOREIGN KEY (liga_id) REFERENCES ligas(id)
        )
    `, 'Tabela rodadas');

    // --- Tabela Rodada_Jogadores (Lista de Presença) ---
    await runQuery(`
        CREATE TABLE IF NOT EXISTS rodada_jogadores (
            rodada_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            PRIMARY KEY (rodada_id, jogador_id),
            FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, 'Tabela rodada_jogadores');

    // --- Tabela Partidas (Jogos Individuais) ---
    // A tabela antiga de partidas será usada, mas agora com um rodada_id
    await runQuery(`ALTER TABLE partidas ADD COLUMN rodada_id INTEGER REFERENCES rodadas(id)`, 'Coluna rodada_id em partidas');
    
    // --- Tabela Resultados (Stats de um jogador em UMA partida) ---
    // A tabela antiga será usada, mas agora o contexto é a partida individual
    await runQuery(`ALTER TABLE resultados ADD COLUMN sem_sofrer_gols BOOLEAN NOT NULL DEFAULT 0`, 'Coluna sem_sofrer_gols em resultados');
    await runQuery(`ALTER TABLE resultados ADD COLUMN advertencias INTEGER DEFAULT 0`, 'Coluna advertencias em resultados');


    // --- Tabelas de Prêmios e Títulos ---
    await runQuery(`
        CREATE TABLE IF NOT EXISTS premios_rodada (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rodada_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            tipo_premio TEXT NOT NULL,
            pontuacao REAL NOT NULL,
            FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, 'Tabela premios_rodada');

    await runQuery(`
        CREATE TABLE IF NOT EXISTS campeonatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            data TEXT NOT NULL
        )
    `, 'Tabela campeonatos');

    await runQuery(`
        CREATE TABLE IF NOT EXISTS campeonato_vencedores (
            campeonato_id INTEGER NOT NULL,
            jogador_id INTEGER NOT NULL,
            PRIMARY KEY (campeonato_id, jogador_id),
            FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id),
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        )
    `, 'Tabela campeonato_vencedores');


    await runQuery('COMMIT;', 'Finalizando transação');

    db.close((err) => {
        if (err) console.error("Erro ao fechar o banco:", err.message);
        else console.log("\nBanco de dados pronto com a estrutura final!");
    });
});
