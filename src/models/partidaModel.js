import db from '../database/db.js';

// Cria uma partida vazia ligada a uma rodada
export function create(rodada_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT data FROM rodadas WHERE id = ?`, [rodada_id], (err, rodada) => {
            if (err) return reject(err);
            if (!rodada) return reject(new Error(`Rodada com ID ${rodada_id} não encontrada.`));
            
            const dataDaRodada = rodada.data;
            const sql = `INSERT INTO partidas (rodada_id, data) VALUES (?, ?)`;
            db.run(sql, [rodada_id, dataDaRodada], function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, rodada_id });
            });
        });
    });
}

// Salva os resultados completos de uma partida
export function updateResultados(partida_id, data) {
    // Adicione time1_numero e time2_numero
    const { placar1, placar2, duracao, time1, time2, time1_numero, time2_numero } = data;

    return new Promise((resolve, reject) => {
        db.exec('BEGIN TRANSACTION', async (err) => {
            if (err) return reject(err);

            try {
                // Adicione as novas colunas à query
                const sqlPartida = `UPDATE partidas SET placar_time1 = ?, placar_time2 = ?, duracao_segundos = ?, time1_numero = ?, time2_numero = ? WHERE id = ?`;
                await new Promise((res, rej) => db.run(sqlPartida, [placar1, placar2, duracao, time1_numero, time2_numero, partida_id], (err) => err ? rej(err) : res()));

                // Apaga os resultados antigos para garantir que não há duplicados
                await new Promise((res, rej) => db.run(`DELETE FROM resultados WHERE partida_id = ?`, [partida_id], (err) => err ? rej(err) : res()));

                // Prepara para inserir os novos resultados
                const sqlResultado = `INSERT INTO resultados (partida_id, jogador_id, time, gols, assistencias, vitorias, derrotas, empates, advertencias, sem_sofrer_gols) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                // Calcula o resultado da partida
                const vitoriaTime1 = placar1 > placar2 ? 1 : 0;
                const vitoriaTime2 = placar2 > placar1 ? 1 : 0;
                const empate = placar1 === placar2 ? 1 : 0;
                const cleanSheet1 = placar2 === 0 ? 1 : 0;
                const cleanSheet2 = placar1 === 0 ? 1 : 0;

                // Cria uma lista de todas as inserções a serem feitas
                const inserts = [];
                time1.forEach(jogador => {
                    inserts.push(new Promise((res, rej) => db.run(sqlResultado, [partida_id, jogador.id, 'Time 1', jogador.gols, jogador.assistencias, vitoriaTime1, vitoriaTime2, empate, 0, cleanSheet1], (err) => err ? rej(err) : res())));
                });
                time2.forEach(jogador => {
                    inserts.push(new Promise((res, rej) => db.run(sqlResultado, [partida_id, jogador.id, 'Time 2', jogador.gols, jogador.assistencias, vitoriaTime2, vitoriaTime1, empate, 0, cleanSheet2], (err) => err ? rej(err) : res())));
                });

                // Executa todas as inserções
                await Promise.all(inserts);

                // Se tudo correu bem, confirma as alterações
                db.exec('COMMIT', (err) => {
                    if (err) return reject(err);
                    resolve({ message: "Resultados da partida salvos com sucesso." });
                });

            } catch (error) {
                // Se algo falhou, desfaz tudo
                db.exec('ROLLBACK', () => reject(error));
            }
        });
    });
}
