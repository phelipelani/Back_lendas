
import db from "../database/db.js";

const PONTOS = {
  GOLS: 4.0,
  ASSISTENCIAS: 2.5,
  VITORIAS: 5.0,
  EMPATES: 2.0,
  DERROTAS: -1.0,
  ADVERTENCIAS: -3.0,
  CLEAN_SHEET: 1.5,
  GOLS_CONTRA: -4.0,
};

export function findById(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE id = ? LIMIT 1`;
    db.get(sql, [rodada_id], (err, row) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodada por ID:', err);
        reject(err);
      } else {
        console.log('[MODEL] Rodada encontrada:', row);
        resolve(row || null);
      }
    });
  });
}

export function findJogadoresByRodadaId(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT j.*, rj.rodada_id 
      FROM jogadores j
      JOIN rodada_jogadores rj ON j.id = rj.jogador_id
      WHERE rj.rodada_id = ?
      ORDER BY j.nome
    `;
    db.all(sql, [rodada_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar jogadores da rodada:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function create(liga_id, data) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, 'aberta')`;
    db.run(sql, [liga_id, data], function (err) {
      if (err) {
        console.error('[MODEL] Erro ao criar rodada:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, liga_id, data, status: "aberta" });
      }
    });
  });
}

export function replaceJogadores(rodada_id, jogadores_ids) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");
      db.run(`DELETE FROM rodada_jogadores WHERE rodada_id = ?`, [rodada_id]);

      if (jogadores_ids && jogadores_ids.length > 0) {
        const sql = `INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)`;
        const stmt = db.prepare(sql);
        for (const id of jogadores_ids) {
          stmt.run(rodada_id, id);
        }
        stmt.finalize((err) => {
          if (err) {
            db.run("ROLLBACK;");
            console.error('[MODEL] Erro ao substituir jogadores:', err);
            return reject(err);
          }
          db.run("COMMIT;", (commitErr) => {
            if(commitErr) return reject(commitErr);
            resolve();
          });
        });
      } else {
        db.run("COMMIT;", (commitErr) => {
          if(commitErr) return reject(commitErr);
          resolve();
        });
      }
    });
  });
}

export function findByLigaId(liga_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data`;
    db.all(sql, [liga_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodadas por liga:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function findByLigaIdAndData(liga_id, data) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? AND data = ? LIMIT 1`;
    db.get(sql, [liga_id, data], (err, row) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodada por liga e data:', err);
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function saveTimesSorteados(rodada_id, times) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");
      db.run(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]);

      if (times && Array.isArray(times)) {
        const sql = `INSERT INTO rodada_times (rodada_id, jogador_id, numero_time) VALUES (?, ?, ?)`;
        const stmt = db.prepare(sql);
        times.forEach((time, index) => {
          const numeroTime = index + 1;
          if (time.jogadores && Array.isArray(time.jogadores)) {
            time.jogadores.forEach(jogador => {
              if (jogador && jogador.id) {
                stmt.run(rodada_id, jogador.id, numeroTime);
              }
            });
          }
        });
        stmt.finalize((err) => {
            if (err) {
              db.run("ROLLBACK;");
              console.error('[MODEL] Erro ao salvar times sorteados:', err);
              return reject(err);
            }
            db.run("COMMIT;", (commitErr) => {
                if(commitErr) return reject(commitErr);
                resolve();
            });
        });
      } else {
          db.run("COMMIT;", (commitErr) => {
              if(commitErr) return reject(commitErr);
              resolve();
          });
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
      if (err) {
        console.error('[MODEL] Erro ao buscar times sorteados:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// A função finalizar é muito complexa para uma transação simples com serialize.
// Ela foi mantida com async/await e as chamadas ao db foram convertidas.
// ATENÇÃO: A transação manual foi removida. O sqlite, por padrão, executa cada comando em sua própria transação.
// Para uma transação completa aqui, seria necessária uma estrutura mais complexa.
export async function finalizar(rodada_id) {
  console.log(`[MODEL] Iniciando finalização da rodada ${rodada_id}`);
  
  // NOTE: This function is complex. For a true all-or-nothing transaction in sqlite3 node driver,
  // it requires careful chaining of callbacks or using a wrapper library.
  // This version executes commands sequentially but not in a single ACID transaction.
  
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
        try {
            db.run("BEGIN TRANSACTION;");

            const rodadaExistente = await new Promise((res, rej) => {
                db.get("SELECT * FROM rodadas WHERE id = ? LIMIT 1", [rodada_id], (err, row) => err ? rej(err) : res(row));
            });
            
            if (!rodadaExistente) throw new Error(`Rodada ${rodada_id} não encontrada`);
            if (rodadaExistente.status === 'finalizada') throw new Error('Rodada já foi finalizada anteriormente');

            const sqlResultados = `
                SELECT 
                    j.id as jogador_id, j.nome, j.joga_recuado,
                    COALESCE(SUM(r.gols), 0) as total_gols,
                    COALESCE(SUM(r.assistencias), 0) as total_assistencias,
                    COALESCE(SUM(r.vitorias), 0) as total_vitorias,
                    COALESCE(SUM(r.empates), 0) as total_empates,
                    COALESCE(SUM(r.derrotas), 0) as total_derrotas,
                    COALESCE(SUM(r.advertencias), 0) as total_advertencias,
                    COALESCE(SUM(r.gols_contra), 0) as total_gols_contra,
                    COALESCE(SUM(r.sem_sofrer_gols), 0) as total_clean_sheets
                FROM jogadores j
                JOIN rodada_jogadores rj ON j.id = rj.jogador_id
                LEFT JOIN resultados r ON r.jogador_id = j.id
                LEFT JOIN partidas p ON r.partida_id = p.id AND p.rodada_id = rj.rodada_id
                WHERE rj.rodada_id = ?
                GROUP BY j.id, j.nome, j.joga_recuado
            `;
            const jogadoresComPontos = await new Promise((res, rej) => {
                db.all(sqlResultados, [rodada_id], (err, rows) => err ? rej(err) : res(rows));
            });

            if (jogadoresComPontos.length === 0) {
              await new Promise((res, rej) => db.run(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id], (err) => err ? rej(err) : res()));
              db.run("COMMIT;");
              return resolve({ message: 'Rodada finalizada sem resultados de partidas.', mvps: [], pesDeRato: [], total_jogadores: 0 });
            }

            const jogadoresComPontuacao = jogadoresComPontos.map(j => {
                const pontos = ((j.total_gols || 0) * PONTOS.GOLS) + ((j.total_assistencias || 0) * PONTOS.ASSISTENCIAS) + ((j.total_vitorias || 0) * PONTOS.VITORIAS) + ((j.total_empates || 0) * PONTOS.EMPATES) + ((j.total_derrotas || 0) * PONTOS.DERROTAS) + ((j.total_advertencias || 0) * PONTOS.ADVERTENCIAS) + ((j.total_gols_contra || 0) * PONTOS.GOLS_CONTRA) + (j.joga_recuado === 1 ? (j.total_clean_sheets || 0) * PONTOS.CLEAN_SHEET : 0);
                return { ...j, total_pontos: parseFloat(pontos.toFixed(2)) };
            });

            const pontuacoes = jogadoresComPontuacao.map(p => p.total_pontos);
            const maxPontos = Math.max(...pontuacoes);
            const minPontos = Math.min(...pontuacoes);
            const mvps = jogadoresComPontuacao.filter(p => p.total_pontos === maxPontos);
            const pesDeRato = jogadoresComPontuacao.filter(p => p.total_pontos === minPontos && p.total_pontos !== maxPontos);
            
            const sqlPremio = `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES (?, ?, ?, ?)`;
            const stmt = db.prepare(sqlPremio);
            mvps.forEach(mvp => stmt.run(rodada_id, mvp.jogador_id, "mvp", maxPontos));
            pesDeRato.forEach(pe => stmt.run(rodada_id, pe.jogador_id, "pe_de_rato", minPontos));
            
            await new Promise((res, rej) => stmt.finalize(err => err ? rej(err) : res()));
            await new Promise((res, rej) => db.run(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id], (err) => err ? rej(err) : res()));
            
            db.run("COMMIT;", (commitErr) => {
                if(commitErr) throw commitErr;
                resolve({ 
                    mvps: mvps.map(m => ({ id: m.jogador_id, nome: m.nome, pontos: m.total_pontos })),
                    pesDeRato: pesDeRato.map(p => ({ id: p.jogador_id, nome: p.nome, pontos: p.total_pontos })),
                    total_jogadores: jogadoresComPontuacao.length,
                    max_pontos: maxPontos,
                    min_pontos: minPontos
                });
            });

        } catch (error) {
            db.run("ROLLBACK;");
            console.error('[MODEL] Erro ao finalizar rodada:', error);
            reject(error);
        }
    });
  });
}

export function getResultadosCompletos(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      WITH JogadoresDaRodada AS (
        SELECT
          j.id, j.nome, j.joga_recuado,
          CASE rt.numero_time
            WHEN 1 THEN 'Time Amarelo' WHEN 2 THEN 'Time Preto'
            WHEN 3 THEN 'Time Azul' WHEN 4 THEN 'Time Rosa'
            ELSE 'Sem Time'
          END as time
        FROM jogadores j
        JOIN rodada_jogadores rj ON j.id = rj.jogador_id
        LEFT JOIN rodada_times rt ON j.id = rt.jogador_id AND rj.rodada_id = rt.rodada_id
        WHERE rj.rodada_id = ?
      )
      SELECT
        j.id, j.nome, j.joga_recuado, j.time,
        COALESCE(SUM(res.gols), 0) as gols,
        COALESCE(SUM(res.assistencias), 0) as assistencias,
        COALESCE(SUM(res.vitorias), 0) as vitorias,
        COALESCE(SUM(res.empates), 0) as empates,
        COALESCE(SUM(res.derrotas), 0) as derrotas,
        COALESCE(SUM(res.advertencias), 0) as advertencias,
        COALESCE(SUM(res.gols_contra), 0) as gols_contra,
        COALESCE(SUM(res.sem_sofrer_gols), 0) as clean_sheets,
        (
          COALESCE(SUM(res.gols), 0) * ${PONTOS.GOLS} +
          COALESCE(SUM(res.assistencias), 0) * ${PONTOS.ASSISTENCIAS} +
          COALESCE(SUM(res.vitorias), 0) * ${PONTOS.VITORIAS} +
          COALESCE(SUM(res.empates), 0) * ${PONTOS.EMPATES} +
          COALESCE(SUM(res.derrotas), 0) * ${PONTOS.DERROTAS} +
          COALESCE(SUM(res.advertencias), 0) * ${PONTOS.ADVERTENCIAS} +
          COALESCE(SUM(res.gols_contra), 0) * ${PONTOS.GOLS_CONTRA} +
          COALESCE(SUM(CASE WHEN j.joga_recuado = 1 THEN res.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END), 0)
        ) as total_pontos
      FROM JogadoresDaRodada j
      LEFT JOIN partidas p ON p.rodada_id = ?
      LEFT JOIN resultados res ON res.jogador_id = j.id AND res.partida_id = p.id
      GROUP BY j.id, j.nome, j.joga_recuado, j.time
      ORDER BY total_pontos DESC;
    `;
    db.all(sql, [rodada_id, rodada_id], (err, rows) => {
      if (err) {
        console.error("[MODEL] Erro ao buscar resultados completos:", err);
        reject(err);
      } else {
        const resultados = rows.map((row) => ({
          ...row,
          total_pontos: row.total_pontos ? parseFloat(Number(row.total_pontos).toFixed(2)) : 0,
          gols: parseInt(row.gols || 0),
          assistencias: parseInt(row.assistencias || 0),
          vitorias: parseInt(row.vitorias || 0),
          empates: parseInt(row.empates || 0),
          derrotas: parseInt(row.derrotas || 0),
          advertencias: parseInt(row.advertencias || 0),
          gols_contra: parseInt(row.gols_contra || 0),
          clean_sheets: parseInt(row.clean_sheets || 0),
        }));
        resolve(resultados);
      }
    });
  });
}

// import dbClient from '../lib/turso.js';

// const PONTOS = {
//   GOLS: 4.0,
//   ASSISTENCIAS: 2.5,
//   VITORIAS: 5.0,
//   EMPATES: 2.0,
//   DERROTAS: -1.0,
//   ADVERTENCIAS: -3.0,
//   CLEAN_SHEET: 1.5,
//   GOLS_CONTRA: -4.0,
// };

// export async function findById(rodada_id) {
//   try {
//     const sql = `SELECT * FROM rodadas WHERE id = ? LIMIT 1`;
//     const result = await dbClient.execute({ sql, args: [rodada_id] });
//     console.log('[MODEL] Rodada encontrada:', result.rows[0]);
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error('[MODEL] Erro ao buscar rodada por ID:', error);
//     throw error;
//   }
// }

// export async function findJogadoresByRodadaId(rodada_id) {
//   try {
//     const sql = `
//       SELECT j.*, rj.rodada_id 
//       FROM jogadores j
//       JOIN rodada_jogadores rj ON j.id = rj.jogador_id
//       WHERE rj.rodada_id = ?
//       ORDER BY j.nome
//     `;
//     const result = await dbClient.execute({ sql, args: [rodada_id] });
//     return result.rows;
//   } catch (error) {
//     console.error('[MODEL] Erro ao buscar jogadores da rodada:', error);
//     throw error;
//   }
// }

// export async function create(liga_id, data) {
//   try {
//     const sql = `INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, 'aberta')`;
//     const result = await dbClient.execute({ sql, args: [liga_id, data] });
//     return { id: Number(result.lastInsertRowid), liga_id, data, status: "aberta" };
//   } catch (error) {
//     console.error('[MODEL] Erro ao criar rodada:', error);
//     throw error;
//   }
// }

// export async function replaceJogadores(rodada_id, jogadores_ids) {
//   // Usamos uma transação em lote (batch) para garantir que ambas as operações (DELETE e INSERTs)
//   // sejam executadas com sucesso. Se uma falhar, nenhuma é aplicada.
//   const tx = await dbClient.transaction('write');
//   try {
//     await tx.execute({
//       sql: `DELETE FROM rodada_jogadores WHERE rodada_id = ?`,
//       args: [rodada_id]
//     });

//     if (jogadores_ids && jogadores_ids.length > 0) {
//       const insertStatements = jogadores_ids.map(id => ({
//         sql: `INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)`,
//         args: [rodada_id, id]
//       }));
//       // Executa todos os inserts em um lote
//       await tx.batch(insertStatements);
//     }
    
//     await tx.commit();
//   } catch (error) {
//     await tx.rollback();
//     console.error('[MODEL] Erro ao substituir jogadores:', error);
//     throw error;
//   }
// }


// export async function findByLigaId(liga_id) {
//   try {
//     const sql = `SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data`;
//     const result = await dbClient.execute({ sql, args: [liga_id] });
//     return result.rows;
//   } catch (error) {
//     console.error('[MODEL] Erro ao buscar rodadas por liga:', error);
//     throw error;
//   }
// }

// export async function findByLigaIdAndData(liga_id, data) {
//   try {
//     const sql = `SELECT * FROM rodadas WHERE liga_id = ? AND data = ? LIMIT 1`;
//     const result = await dbClient.execute({ sql, args: [liga_id, data] });
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error('[MODEL] Erro ao buscar rodada por liga e data:', error);
//     throw error;
//   }
// }

// export async function saveTimesSorteados(rodada_id, times) {
//   const tx = await dbClient.transaction('write');
//   try {
//     await tx.execute({
//       sql: `DELETE FROM rodada_times WHERE rodada_id = ?`,
//       args: [rodada_id]
//     });

//     if (times && Array.isArray(times)) {
//       const values = [];
//       times.forEach((time, index) => {
//         const numeroTime = index + 1;
//         if (time.jogadores && Array.isArray(time.jogadores)) {
//           time.jogadores.forEach(jogador => {
//             if (jogador && jogador.id) {
//               values.push({
//                 sql: `INSERT INTO rodada_times (rodada_id, jogador_id, numero_time) VALUES (?, ?, ?)`,
//                 args: [rodada_id, jogador.id, numeroTime]
//               });
//             }
//           });
//         }
//       });

//       if (values.length > 0) {
//         await tx.batch(values);
//       }
//     }

//     await tx.commit();
//   } catch (error) {
//     await tx.rollback();
//     console.error('[MODEL] Erro ao salvar times sorteados:', error);
//     throw error;
//   }
// }

// export async function getTimesSorteados(rodada_id) {
//   try {
//     const sql = `
//       SELECT j.*, rt.numero_time 
//       FROM jogadores j
//       JOIN rodada_times rt ON j.id = rt.jogador_id
//       WHERE rt.rodada_id = ?
//       ORDER BY rt.numero_time
//     `;
//     const result = await dbClient.execute({ sql, args: [rodada_id] });
//     return result.rows;
//   } catch (error) {
//     console.error('[MODEL] Erro ao buscar times sorteados:', error);
//     throw error;
//   }
// }

// export async function finalizar(rodada_id) {
//   console.log(`[MODEL] Iniciando finalização da rodada ${rodada_id}`);
//   // Para lógicas complexas como esta, usamos uma transação interativa
//   const tx = await dbClient.transaction('write');
//   try {
//     const rodadaResult = await tx.execute({
//         sql: "SELECT * FROM rodadas WHERE id = ? LIMIT 1",
//         args: [rodada_id]
//     });
//     const rodadaExistente = rodadaResult.rows[0];

//     if (!rodadaExistente) throw new Error(`Rodada ${rodada_id} não encontrada`);
//     if (rodadaExistente.status === 'finalizada') throw new Error('Rodada já foi finalizada anteriormente');

//     const sqlResultados = `
//         SELECT 
//             j.id as jogador_id, j.nome, j.joga_recuado,
//             COALESCE(SUM(r.gols), 0) as total_gols,
//             COALESCE(SUM(r.assistencias), 0) as total_assistencias,
//             COALESCE(SUM(r.vitorias), 0) as total_vitorias,
//             COALESCE(SUM(r.empates), 0) as total_empates,
//             COALESCE(SUM(r.derrotas), 0) as total_derrotas,
//             COALESCE(SUM(r.advertencias), 0) as total_advertencias,
//             COALESCE(SUM(r.gols_contra), 0) as total_gols_contra,
//             COALESCE(SUM(r.sem_sofrer_gols), 0) as total_clean_sheets
//         FROM jogadores j
//         JOIN rodada_jogadores rj ON j.id = rj.jogador_id
//         LEFT JOIN resultados r ON r.jogador_id = j.id
//         LEFT JOIN partidas p ON r.partida_id = p.id AND p.rodada_id = rj.rodada_id
//         WHERE rj.rodada_id = ?
//         GROUP BY j.id, j.nome, j.joga_recuado
//     `;
//     const jogadoresResult = await tx.execute({ sql: sqlResultados, args: [rodada_id] });
//     const jogadoresComPontos = jogadoresResult.rows;

//     if (jogadoresComPontos.length === 0) {
//       await tx.execute({ sql: `UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, args: [rodada_id] });
//       await tx.commit();
//       return { message: 'Rodada finalizada sem resultados de partidas.', mvps: [], pesDeRato: [], total_jogadores: 0 };
//     }

//     const jogadoresComPontuacao = jogadoresComPontos.map(jogador => {
//       const pontos = ((jogador.total_gols || 0) * PONTOS.GOLS) + ((jogador.total_assistencias || 0) * PONTOS.ASSISTENCIAS) + ((jogador.total_vitorias || 0) * PONTOS.VITORIAS) + ((jogador.total_empates || 0) * PONTOS.EMPATES) + ((jogador.total_derrotas || 0) * PONTOS.DERROTAS) + ((jogador.total_advertencias || 0) * PONTOS.ADVERTENCIAS) + ((jogador.total_gols_contra || 0) * PONTOS.GOLS_CONTRA) + (jogador.joga_recuado === 1 ? (jogador.total_clean_sheets || 0) * PONTOS.CLEAN_SHEET : 0);
//       return { ...jogador, total_pontos: parseFloat(pontos.toFixed(2)) };
//     });

//     const pontuacoes = jogadoresComPontuacao.map(p => p.total_pontos);
//     const maxPontos = Math.max(...pontuacoes);
//     const minPontos = Math.min(...pontuacoes);
//     const mvps = jogadoresComPontuacao.filter(p => p.total_pontos === maxPontos);
//     const pesDeRato = jogadoresComPontuacao.filter(p => p.total_pontos === minPontos && p.total_pontos !== maxPontos);
    
//     const premiosStatements = [];
//     mvps.forEach(mvp => premiosStatements.push({
//         sql: `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES (?, ?, ?, ?)`,
//         args: [rodada_id, mvp.jogador_id, "mvp", maxPontos]
//     }));
//     pesDeRato.forEach(pe => premiosStatements.push({
//         sql: `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES (?, ?, ?, ?)`,
//         args: [rodada_id, pe.jogador_id, "pe_de_rato", minPontos]
//     }));
    
//     if (premiosStatements.length > 0) {
//         await tx.batch(premiosStatements);
//     }
    
//     await tx.execute({ sql: `UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, args: [rodada_id] });
//     await tx.commit();

//     return {
//       mvps: mvps.map(m => ({ id: m.jogador_id, nome: m.nome, pontos: m.total_pontos })),
//       pesDeRato: pesDeRato.map(p => ({ id: p.jogador_id, nome: p.nome, pontos: p.total_pontos })),
//       total_jogadores: jogadoresComPontuacao.length,
//       max_pontos: maxPontos,
//       min_pontos: minPontos
//     };
//   } catch (error) {
//     await tx.rollback();
//     console.error('[MODEL] Erro ao finalizar rodada:', error);
//     throw error;
//   }
// }

// export async function getResultadosCompletos(rodada_id) {
//   try {
//     const sql = `
//       WITH JogadoresDaRodada AS (
//         SELECT
//           j.id, j.nome, j.joga_recuado,
//           CASE rt.numero_time
//             WHEN 1 THEN 'Time Amarelo' WHEN 2 THEN 'Time Preto'
//             WHEN 3 THEN 'Time Azul' WHEN 4 THEN 'Time Rosa'
//             ELSE 'Sem Time'
//           END as time
//         FROM jogadores j
//         JOIN rodada_jogadores rj ON j.id = rj.jogador_id
//         LEFT JOIN rodada_times rt ON j.id = rt.jogador_id AND rj.rodada_id = rt.rodada_id
//         WHERE rj.rodada_id = ?
//       )
//       SELECT
//         j.id, j.nome, j.joga_recuado, j.time,
//         COALESCE(SUM(res.gols), 0) as gols,
//         COALESCE(SUM(res.assistencias), 0) as assistencias,
//         COALESCE(SUM(res.vitorias), 0) as vitorias,
//         COALESCE(SUM(res.empates), 0) as empates,
//         COALESCE(SUM(res.derrotas), 0) as derrotas,
//         COALESCE(SUM(res.advertencias), 0) as advertencias,
//         COALESCE(SUM(res.gols_contra), 0) as gols_contra,
//         COALESCE(SUM(res.sem_sofrer_gols), 0) as clean_sheets,
//         (
//           COALESCE(SUM(res.gols), 0) * ${PONTOS.GOLS} +
//           COALESCE(SUM(res.assistencias), 0) * ${PONTOS.ASSISTENCIAS} +
//           COALESCE(SUM(res.vitorias), 0) * ${PONTOS.VITORIAS} +
//           COALESCE(SUM(res.empates), 0) * ${PONTOS.EMPATES} +
//           COALESCE(SUM(res.derrotas), 0) * ${PONTOS.DERROTAS} +
//           COALESCE(SUM(res.advertencias), 0) * ${PONTOS.ADVERTENCIAS} +
//           COALESCE(SUM(res.gols_contra), 0) * ${PONTOS.GOLS_CONTRA} +
//           COALESCE(SUM(CASE WHEN j.joga_recuado = 1 THEN res.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END), 0)
//         ) as total_pontos
//       FROM JogadoresDaRodada j
//       LEFT JOIN partidas p ON p.rodada_id = ?
//       LEFT JOIN resultados res ON res.jogador_id = j.id AND res.partida_id = p.id
//       GROUP BY j.id, j.nome, j.joga_recuado, j.time
//       ORDER BY total_pontos DESC;
//     `;
    
//     const result = await dbClient.execute({ sql, args: [rodada_id, rodada_id] });

//     const resultados = result.rows.map((row) => ({
//       ...row,
//       total_pontos: row.total_pontos ? parseFloat(Number(row.total_pontos).toFixed(2)) : 0,
//       gols: parseInt(row.gols || 0),
//       assistencias: parseInt(row.assistencias || 0),
//       vitorias: parseInt(row.vitorias || 0),
//       empates: parseInt(row.empates || 0),
//       derrotas: parseInt(row.derrotas || 0),
//       advertencias: parseInt(row.advertencias || 0),
//       gols_contra: parseInt(row.gols_contra || 0),
//       clean_sheets: parseInt(row.clean_sheets || 0),
//     }));
//     return resultados;

//   } catch (error) {
//     console.error("[MODEL] Erro ao buscar resultados completos:", error);
//     throw error;
//   }
// }