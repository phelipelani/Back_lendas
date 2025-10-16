import db from '../database/db.js';

export function add(liga) {
  return new Promise((resolve, reject) => {
    const { nome, data_inicio, data_fim } = liga;
    const sql = 'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)';
    
    db.run(sql, [nome, data_inicio, data_fim], function(err) {
      if (err) {
        console.error("Erro ao adicionar liga:", err);
        reject(err);
      } else {
        resolve({ id: this.lastID, ...liga });
      }
    });
  });
}

export function findAll() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM ligas ORDER BY nome`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar todas as ligas:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function findById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ligas WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Erro ao buscar liga por ID:", err);
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

// import dbClient from '../lib/turso.js';

// export async function add(liga) {
//   try {
//     const { nome, data_inicio, data_fim } = liga;
//     const sql = 'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)';
//     const result = await dbClient.execute({ sql, args: [nome, data_inicio, data_fim] });
//     return { id: Number(result.lastInsertRowid), ...liga };
//   } catch (error) {
//     console.error("Erro ao adicionar liga:", error);
//     throw error;
//   }
// }

// export async function findAll() {
//   try {
//     const sql = 'SELECT * FROM ligas ORDER BY data_inicio DESC';
//     const result = await dbClient.execute(sql);
//     return result.rows;
//   } catch (error) {
//     console.error("Erro ao buscar todas as ligas:", error);
//     throw error;
//   }
// }

// export async function findById(id) {
//   try {
//     const sql = 'SELECT * FROM ligas WHERE id = ?';
//     const result = await dbClient.execute({ sql, args: [id] });
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error("Erro ao buscar liga por ID:", error);
//     throw error;
//   }
// }