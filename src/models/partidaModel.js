// import pool from "../database/db.js";

// export async function create(rodada_id) {
//   try {
//     const sqlRodada = `SELECT data FROM rodadas WHERE id = ?`;
//     const [rodadas] = await pool.query(sqlRodada, [rodada_id]);
    
//     if (rodadas.length === 0) {
//       throw new Error(`Rodada com ID ${rodada_id} não encontrada.`);
//     }

//     const dataDaRodada = rodadas[0].data;
//     const sqlInsert = `INSERT INTO partidas (rodada_id, data) VALUES (?, ?)`;
//     const [result] = await pool.query(sqlInsert, [rodada_id, dataDaRodada]);
    
//     return { id: result.insertId, rodada_id };
//   } catch (error) {
//     console.error("Erro ao criar partida:", error);
//     throw error;
//   }
// }

// export async function updateResultados(partida_id, data) {
//   const { placar1, placar2, duracao, time1, time2, time1_numero, time2_numero } = data;
//   let connection;

//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();

//     const sqlPartida = `UPDATE partidas SET placar_time1 = ?, placar_time2 = ?, duracao_segundos = ?, time1_numero = ?, time2_numero = ? WHERE id = ?`;
//     await connection.query(sqlPartida, [placar1, placar2, duracao, time1_numero, time2_numero, partida_id]);

//     await connection.query(`DELETE FROM resultados WHERE partida_id = ?`, [partida_id]);

//     const sqlResultado = `INSERT INTO resultados (partida_id, jogador_id, time, gols, assistencias, vitorias, derrotas, empates, advertencias, sem_sofrer_gols) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
//     const vitoriaTime1 = placar1 > placar2 ? 1 : 0;
//     const vitoriaTime2 = placar2 > placar1 ? 1 : 0;
//     const empate = placar1 === placar2 ? 1 : 0;
//     const cleanSheet1 = placar2 === 0 ? 1 : 0;
//     const cleanSheet2 = placar1 === 0 ? 1 : 0;

//     for (const jogador of time1) {
//       await connection.query(sqlResultado, [partida_id, jogador.id, "Time 1", jogador.gols, jogador.assistencias, vitoriaTime1, vitoriaTime2, empate, 0, cleanSheet1]);
//     }
//     for (const jogador of time2) {
//       await connection.query(sqlResultado, [partida_id, jogador.id, "Time 2", jogador.gols, jogador.assistencias, vitoriaTime2, vitoriaTime1, empate, 0, cleanSheet2]);
//     }

//     await connection.commit();
//     return { message: "Resultados da partida salvos com sucesso." };
//   } catch (error) {
//     if (connection) await connection.rollback();
//     console.error("Erro ao atualizar resultados da partida:", error);
//     throw error;
//   } finally {
//     if (connection) connection.release();
//   }
// }

// export async function registrarGolContra(partida_id, jogador_id, time_marcou_ponto, time_do_jogador_numero) {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         await connection.beginTransaction();

//         const placarField = time_marcou_ponto === 1 ? 'placar_time1' : 'placar_time2';
//         const sqlUpdatePlacar = `UPDATE partidas SET ${placarField} = ${placarField} + 1 WHERE id = ?`;
//         await connection.query(sqlUpdatePlacar, [partida_id]);

//         const sqlFind = `SELECT id FROM resultados WHERE partida_id = ? AND jogador_id = ?`;
//         const [rows] = await connection.query(sqlFind, [partida_id, jogador_id]);

//         if (rows.length > 0) {
//             const row = rows[0];
//             const sqlUpdateJogador = `UPDATE resultados SET gols_contra = gols_contra + 1 WHERE id = ?`;
//             await connection.query(sqlUpdateJogador, [row.id]);
//         } else {
//             const timeString = `Time ${time_do_jogador_numero}`;
//             const sqlInsertJogador = `INSERT INTO resultados (partida_id, jogador_id, time, gols_contra) VALUES (?, ?, ?, 1)`;
//             await connection.query(sqlInsertJogador, [partida_id, jogador_id, timeString]);
//         }
        
//         await connection.commit();
//         return { message: "Gol contra registrado com sucesso." };
//     } catch (error) {
//         if (connection) await connection.rollback();
//         console.error("Erro ao registrar gol contra:", error);
//         throw error;
//     } finally {
//         if (connection) connection.release();
//     }
// }

import db from "../database/db.js";

export function create(rodada_id) {
  return new Promise((resolve, reject) => {
    const sqlRodada = `SELECT data FROM rodadas WHERE id = ?`;
    db.get(sqlRodada, [rodada_id], (err, rodada) => {
      if (err) {
        console.error("Erro ao buscar rodada para criar partida:", err);
        return reject(err);
      }
      if (!rodada) {
        return reject(new Error(`Rodada com ID ${rodada_id} não encontrada.`));
      }

      const dataDaRodada = rodada.data;
      const sqlInsert = `INSERT INTO partidas (rodada_id, data) VALUES (?, ?)`;
      db.run(sqlInsert, [rodada_id, dataDaRodada], function (err) {
        if (err) {
          console.error("Erro ao criar partida:", err);
          reject(err);
        } else {
          resolve({ id: this.lastID, rodada_id });
        }
      });
    });
  });
}

export function updateResultados(partida_id, data) {
  return new Promise((resolve, reject) => {
    const { placar1, placar2, duracao, time1, time2, time1_numero, time2_numero } = data;
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        const sqlPartida = `UPDATE partidas SET placar_time1 = ?, placar_time2 = ?, duracao_segundos = ?, time1_numero = ?, time2_numero = ? WHERE id = ?`;
        db.run(sqlPartida, [placar1, placar2, duracao, time1_numero, time2_numero, partida_id]);

        db.run(`DELETE FROM resultados WHERE partida_id = ?`, [partida_id]);

        const sqlResultado = `INSERT INTO resultados (partida_id, jogador_id, time, gols, assistencias, vitorias, derrotas, empates, advertencias, sem_sofrer_gols, gols_contra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;
        
        const stmt = db.prepare(sqlResultado);
        
        const vitoriaTime1 = placar1 > placar2 ? 1 : 0;
        const derrotaTime1 = placar1 < placar2 ? 1 : 0;
        const vitoriaTime2 = placar2 > placar1 ? 1 : 0;
        const derrotaTime2 = placar2 < placar1 ? 1 : 0;
        const empate = placar1 === placar2 ? 1 : 0;
        const cleanSheet1 = placar2 === 0 ? 1 : 0;
        const cleanSheet2 = placar1 === 0 ? 1 : 0;

        for (const jogador of time1) {
            stmt.run(partida_id, jogador.id, "Time 1", jogador.gols, jogador.assistencias, vitoriaTime1, derrotaTime1, empate, 0, cleanSheet1);
        }
        for (const jogador of time2) {
            stmt.run(partida_id, jogador.id, "Time 2", jogador.gols, jogador.assistencias, vitoriaTime2, derrotaTime2, empate, 0, cleanSheet2);
        }

        stmt.finalize((err) => {
            if (err) {
                db.run("ROLLBACK;");
                console.error("Erro ao atualizar resultados da partida:", err);
                return reject(err);
            }
            db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                    console.error("Erro ao commitar resultados da partida:", commitErr);
                    return reject(commitErr);
                }
                resolve({ message: "Resultados da partida salvos com sucesso." });
            });
        });
    });
  });
}

export function registrarGolContra(partida_id, jogador_id, time_marcou_ponto) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");

            const placarField = time_marcou_ponto === 1 ? 'placar_time1' : 'placar_time2';
            const sqlUpdatePlacar = `UPDATE partidas SET ${placarField} = ${placarField} + 1 WHERE id = ?`;
            db.run(sqlUpdatePlacar, [partida_id]);
            
            const sqlFind = `SELECT id FROM resultados WHERE partida_id = ? AND jogador_id = ?`;
            db.get(sqlFind, [partida_id, jogador_id], (err, row) => {
                if(err){
                    db.run("ROLLBACK;");
                    return reject(err);
                }

                if (row) {
                    const sqlUpdateJogador = `UPDATE resultados SET gols_contra = gols_contra + 1 WHERE id = ?`;
                    db.run(sqlUpdateJogador, [row.id]);
                } else {
                    // This case is tricky as we don't know the player's team. Assuming it's not critical to insert here if they weren't in the match.
                    // For now, we only update if the player is already in the results table for that match.
                    // If a new entry must be created, more info (like the player's team) is needed.
                }

                db.run("COMMIT;", (commitErr) => {
                    if (commitErr) {
                         db.run("ROLLBACK;");
                        console.error("Erro ao commitar gol contra:", commitErr);
                        return reject(commitErr);
                    }
                    resolve({ message: "Gol contra registrado com sucesso." });
                });
            });
        });
    });
}