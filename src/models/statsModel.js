// import pool from '../database/db.js';

// const PONTOS = { GOLS: 0.6, ASSISTENCIAS: 0.3, VITORIAS: 5, EMPATES: 2.5, DERROTAS: -1, ADVERTENCIAS: -5, CLEAN_SHEET: 0.3 };

// const getRankingPontos = async (ligaId) => {
//     let sql = `
//         SELECT j.nome, j.id,
//             SUM(r.vitorias) as vitorias, SUM(r.derrotas) as derrotas, SUM(r.empates) as empates,
//             SUM(r.gols) as gols, SUM(r.assistencias) as assistencias,
//             (
//                 SUM(r.gols) * ${PONTOS.GOLS} + SUM(r.assistencias) * ${PONTOS.ASSISTENCIAS} +
//                 SUM(r.vitorias) * ${PONTOS.VITORIAS} + SUM(r.empates) * ${PONTOS.EMPATES} +
//                 SUM(r.derrotas) * ${PONTOS.DERROTAS} + SUM(r.advertencias) * ${PONTOS.ADVERTENCIAS} +
//                 SUM(CASE WHEN j.joga_recuado = 1 THEN r.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END)
//             ) as total_pontos
//         FROM resultados r
//         JOIN jogadores j ON r.jogador_id = j.id
//         JOIN partidas p ON r.partida_id = p.id
//     `;
//     const params = [];
//     if (ligaId) {
//         sql += ` JOIN rodadas ro ON p.rodada_id = ro.id WHERE ro.liga_id = ?`;
//         params.push(ligaId);
//     }
//     sql += ` GROUP BY j.id, j.nome ORDER BY total_pontos DESC;`;

//     const [rows] = await pool.query(sql, params);
//     return rows;
// };

// const getPremiosCount = async (ligaId) => {
//     let sql = `
//         SELECT j.nome, j.id, pr.tipo_premio, COUNT(pr.id) as total
//         FROM premios_rodada pr
//         JOIN jogadores j ON pr.jogador_id = j.id
//     `;
//     const params = [];
//     if (ligaId) {
//         sql += ` JOIN rodadas ro ON pr.rodada_id = ro.id WHERE ro.liga_id = ?`;
//         params.push(ligaId);
//     }
//     sql += ` GROUP BY j.id, j.nome, pr.tipo_premio;`;
    
//     const [rows] = await pool.query(sql, params);
//     return rows;
// };

// export async function getLigaStats(ligaId = null) {
//     try {
//         const [ranking, premios] = await Promise.all([
//             getRankingPontos(ligaId),
//             getPremiosCount(ligaId)
//         ]);

//         const statsConsolidadas = ranking.map(jogador => {
//             const mvp = premios.find(p => p.id === jogador.id && p.tipo_premio === 'mvp');
//             const peDeRato = premios.find(p => p.id === jogador.id && p.tipo_premio === 'pe_de_rato');
//             return {
//                 ...jogador,
//                 total_pontos: parseFloat(Number(jogador.total_pontos).toFixed(2)),
//                 mvp_count: mvp ? mvp.total : 0,
//                 pe_de_rato_count: peDeRato ? peDeRato.total : 0,
//             };
//         });

//         return statsConsolidadas;
//     } catch (error) {
//         console.error("[MODEL] Erro ao consolidar estatísticas:", error);
//         throw error;
//     }
// }

import db from '../database/db.js';

const PONTOS = { GOLS: 0.6, ASSISTENCIAS: 0.3, VITORIAS: 5, EMPATES: 2.5, DERROTAS: -1, ADVERTENCIAS: -5, CLEAN_SHEET: 0.3 };

const getRankingPontos = (ligaId) => {
  return new Promise((resolve, reject) => {
    let sql = `
        SELECT j.nome, j.id,
            SUM(r.vitorias) as vitorias, SUM(r.derrotas) as derrotas, SUM(r.empates) as empates,
            SUM(r.gols) as gols, SUM(r.assistencias) as assistencias,
            (
                SUM(r.gols) * ${PONTOS.GOLS} + SUM(r.assistencias) * ${PONTOS.ASSISTENCIAS} +
                SUM(r.vitorias) * ${PONTOS.VITORIAS} + SUM(r.empates) * ${PONTOS.EMPATES} +
                SUM(r.derrotas) * ${PONTOS.DERROTAS} + SUM(r.advertencias) * ${PONTOS.ADVERTENCIAS} +
                SUM(CASE WHEN j.joga_recuado = 1 THEN r.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END)
            ) as total_pontos
        FROM resultados r
        JOIN jogadores j ON r.jogador_id = j.id
        JOIN partidas p ON r.partida_id = p.id
    `;
    const params = [];
    if (ligaId) {
        sql += ` JOIN rodadas ro ON p.rodada_id = ro.id WHERE ro.liga_id = ?`;
        params.push(ligaId);
    }
    sql += ` GROUP BY j.id, j.nome ORDER BY total_pontos DESC;`;

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const getPremiosCount = (ligaId) => {
  return new Promise((resolve, reject) => {
    let sql = `
        SELECT j.nome, j.id, pr.tipo_premio, COUNT(pr.id) as total
        FROM premios_rodada pr
        JOIN jogadores j ON pr.jogador_id = j.id
    `;
    const params = [];
    if (ligaId) {
        sql += ` JOIN rodadas ro ON pr.rodada_id = ro.id WHERE ro.liga_id = ?`;
        params.push(ligaId);
    }
    sql += ` GROUP BY j.id, j.nome, pr.tipo_premio;`;
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export async function getLigaStats(ligaId = null) {
    try {
        const [ranking, premios] = await Promise.all([
            getRankingPontos(ligaId),
            getPremiosCount(ligaId)
        ]);

        const statsConsolidadas = ranking.map(jogador => {
            const mvp = premios.find(p => p.id === jogador.id && p.tipo_premio === 'mvp');
            const peDeRato = premios.find(p => p.id === jogador.id && p.tipo_premio === 'pe_de_rato');
            return {
                ...jogador,
                total_pontos: parseFloat(Number(jogador.total_pontos || 0).toFixed(2)),
                mvp_count: mvp ? mvp.total : 0,
                pe_de_rato_count: peDeRato ? peDeRato.total : 0,
            };
        });

        return statsConsolidadas;
    } catch (error) {
        console.error("[MODEL] Erro ao consolidar estatísticas:", error);
        throw error;
    }
}