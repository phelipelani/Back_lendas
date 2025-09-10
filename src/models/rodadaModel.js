import db from '../database/db.js'; // CORREÇÃO: O caminho correto é a partir da pasta 'database'
const PONTOS = { GOLS: 0.6, ASSISTENCIAS: 0.3, VITORIAS: 5, EMPATES: 2.5, DERROTAS: -1, ADVERTENCIAS: -5, CLEAN_SHEET: 0.3 };

export function create(liga_id, data) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO rodadas (liga_id, data) VALUES (?, ?)`;
        db.run(sql, [liga_id, data], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, liga_id, data, status: 'aberta' });
        });
    });
}

export function replaceJogadores(rodada_id, jogadores_ids) {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));
                await new Promise((res, rej) => db.run(`DELETE FROM rodada_jogadores WHERE rodada_id = ?`, [rodada_id], err => err ? rej(err) : res()));
                const sql = `INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)`;
                for (const jogador_id of jogadores_ids) {
                    await new Promise((res, rej) => db.run(sql, [rodada_id, jogador_id], err => err ? rej(err) : res()));
                }
                await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
                resolve();
            } catch (error) {
                await new Promise((res, rej) => db.run('ROLLBACK', err => err ? rej(err) : res()));
                reject(error);
            }
        });
    });
}

export function findByLigaId(liga_id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data`;
        db.all(sql, [liga_id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

export function findByLigaIdAndData(liga_id, data) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM rodadas WHERE liga_id = ? AND data = ?`;
        db.get(sql, [liga_id, data], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

export function saveTimesSorteados(rodada_id, times) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO rodada_times (rodada_id, jogador_id, numero_time) VALUES (?, ?, ?)`;
        db.serialize(async () => {
            try {
                await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));
                await new Promise((res, rej) => db.run(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id], err => err ? rej(err) : res()));

                for (let i = 0; i < times.length; i++) {
                    const time = times[i];
                    const numeroTime = i + 1;
                    for (const jogador of time.jogadores) {
                        await new Promise((res, rej) => db.run(sql, [rodada_id, jogador.id, numeroTime], err => err ? rej(err) : res()));
                    }
                }
                await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
                resolve();
            } catch (error) {
                await new Promise((res, rej) => db.run('ROLLBACK', err => err ? rej(err) : res()));
                reject(error);
            }
        });
    });
}

export function getTimesSorteados(rodada_id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT j.*, rt.numero_time 
            FROM jogadores j
            JOIN rodada_times rt ON j.id = rt.jogador_id
            WHERE rt.rodada_id = ?
            ORDER BY rt.numero_time
        `;
        db.all(sql, [rodada_id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}


// Finaliza a rodada, calcula pontos e salva prémios
export function finalizar(rodada_id) {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));

                const sqlPontos = `
                    SELECT
                        r.jogador_id,
                        j.nome, 
                        (
                            SUM(r.gols) * ${PONTOS.GOLS} + SUM(r.assistencias) * ${PONTOS.ASSISTENCIAS} +
                            SUM(r.vitorias) * ${PONTOS.VITORIAS} + SUM(r.empates) * ${PONTOS.EMPATES} +
                            SUM(r.derrotas) * ${PONTOS.DERROTAS} + SUM(r.advertencias) * ${PONTOS.ADVERTENCIAS} +
                            SUM(CASE WHEN j.joga_recuado = 1 THEN r.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END)
                        ) as total_pontos
                    FROM resultados r
                    JOIN partidas p ON r.partida_id = p.id
                    JOIN jogadores j ON r.jogador_id = j.id
                    WHERE p.rodada_id = ?
                    GROUP BY r.jogador_id, j.nome;
                `;
                const pontosJogadores = await new Promise((res, rej) => db.all(sqlPontos, [rodada_id], (err, rows) => err ? rej(err) : res(rows)));

                if (pontosJogadores.length === 0) {
                    await new Promise((res, rej) => db.run('ROLLBACK', err => err ? rej(err) : res()));
                    return reject(new Error("Nenhum jogador com pontos na rodada."));
                }

                const pontuacoes = pontosJogadores.map(p => p.total_pontos);
                const maxPontos = Math.max(...pontuacoes);
                const minPontos = Math.min(...pontuacoes);

                const mvps = pontosJogadores.filter(p => p.total_pontos === maxPontos);
                const pesDeRato = pontosJogadores.filter(p => p.total_pontos === minPontos);

                const sqlPremio = `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES (?, ?, ?, ?)`;
                for (const mvp of mvps) {
                    await new Promise((res, rej) => db.run(sqlPremio, [rodada_id, mvp.jogador_id, 'mvp', maxPontos], err => err ? rej(err) : res()));
                }
                if (maxPontos !== minPontos) {
                    for (const pe of pesDeRato) {
                        await new Promise((res, rej) => db.run(sqlPremio, [rodada_id, pe.jogador_id, 'pe_de_rato', minPontos], err => err ? rej(err) : res()));
                    }
                }

                await new Promise((res, rej) => db.run(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id], err => err ? rej(err) : res()));

                await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
                resolve({ mvps, pesDeRato });

            } catch (error) {
                await new Promise((res, rej) => db.run('ROLLBACK', err => err ? rej(err) : res()));
                reject(error);
            }
        });
    });
}

export function getResultadosCompletos(rodada_id) {
    const PONTOS = { GOLS: 0.6, ASSISTENCIAS: 0.3, VITORIAS: 5, EMPATES: 2.5, DERROTAS: -1, ADVERTENCIAS: -5, CLEAN_SHEET: 0.3 };
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                j.nome, j.id,
                SUM(r.gols) as gols,
                SUM(r.assistencias) as assistencias,
                (
                    SUM(r.gols) * ${PONTOS.GOLS} + SUM(r.assistencias) * ${PONTOS.ASSISTENCIAS} +
                    SUM(r.vitorias) * ${PONTOS.VITORIAS} + SUM(r.empates) * ${PONTOS.EMPATES} +
                    SUM(r.derrotas) * ${PONTOS.DERROTAS} + SUM(r.advertencias) * ${PONTOS.ADVERTENCIAS} +
                    SUM(CASE WHEN j.joga_recuado = 1 THEN r.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END)
                ) as total_pontos
            FROM resultados r
            JOIN jogadores j ON r.jogador_id = j.id
            JOIN partidas p ON r.partida_id = p.id
            WHERE p.rodada_id = ?
            GROUP BY j.id, j.nome
            ORDER BY total_pontos DESC;
        `;
        db.all(sql, [rodada_id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(row => ({...row, total_pontos: parseFloat(row.total_pontos.toFixed(2))})));
        });
    });
}
