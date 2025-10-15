// import pool from '../database/db.js';

// export async function create(nome, data) {
//   try {
//     const sql = `INSERT INTO campeonatos (nome, data) VALUES (?, ?)`;
//     const [result] = await pool.query(sql, [nome, data]);
//     return { id: result.insertId, nome, data };
//   } catch (error) {
//     console.error("Erro ao criar campeonato:", error);
//     throw error;
//   }
// }

// export async function addVencedores(campeonato_id, jogadores_ids) {
//   let connection;
//   try {
//     // Pega uma conexão do pool para a transação
//     connection = await pool.getConnection();
//     await connection.beginTransaction();

//     const sql = `INSERT INTO campeonato_vencedores (campeonato_id, jogador_id) VALUES (?, ?)`;
//     for (const id of jogadores_ids) {
//       await connection.query(sql, [campeonato_id, id]);
//     }

//     await connection.commit();
//   } catch (error) {
//     if (connection) await connection.rollback(); // Desfaz tudo se der erro
//     console.error("Erro ao adicionar vencedores:", error);
//     throw error;
//   } finally {
//     if (connection) connection.release(); // Libera a conexão de volta para o pool
//   }
// }

// export async function getTitulosPorJogador() {
//   try {
//     const sql = `
//         SELECT j.nome, j.id, COUNT(cv.campeonato_id) as titulos
//         FROM jogadores j
//         LEFT JOIN campeonato_vencedores cv ON j.id = cv.jogador_id
//         GROUP BY j.id, j.nome
//         HAVING titulos > 0
//         ORDER BY titulos DESC;
//     `;
//     const [rows] = await pool.query(sql);
//     return rows;
//   } catch (error) {
//     console.error("Erro ao buscar títulos por jogador:", error);
//     throw error;
//   }
// }

import db from '../database/db.js';

export function create(nome, data) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO campeonatos (nome, data) VALUES (?, ?)`;
    db.run(sql, [nome, data], function(err) {
      if (err) {
        console.error("Erro ao criar campeonato:", err);
        reject(err);
      } else {
        resolve({ id: this.lastID, nome, data });
      }
    });
  });
}

export function addVencedores(campeonato_id, jogadores_ids) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO campeonato_vencedores (campeonato_id, jogador_id) VALUES (?, ?)`;
    
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");
      
      const stmt = db.prepare(sql);
      for (const id of jogadores_ids) {
        stmt.run(campeonato_id, id);
      }
      stmt.finalize((err) => {
        if (err) {
            db.run("ROLLBACK;");
            console.error("Erro ao adicionar vencedores:", err);
            reject(err);
        } else {
            db.run("COMMIT;", (commitErr) => {
                if(commitErr) {
                    console.error("Erro ao commitar transação:", commitErr);
                    reject(commitErr);
                } else {
                    resolve();
                }
            });
        }
      });
    });
  });
}

export function getTitulosPorJogador() {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT j.nome, j.id, COUNT(cv.campeonato_id) as titulos
        FROM jogadores j
        LEFT JOIN campeonato_vencedores cv ON j.id = cv.jogador_id
        GROUP BY j.id, j.nome
        HAVING titulos > 0
        ORDER BY titulos DESC;
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Erro ao buscar títulos por jogador:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}